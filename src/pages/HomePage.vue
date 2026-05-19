<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else>
    <h1 class="screen-title">{{ today }}</h1>

    <!-- 今日进度卡片 -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">今日复习</div>
          <div class="card-subtitle">{{ reviewSubtitle }}</div>
        </div>
        <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--accent);">{{ progressPercent }}%</div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <div class="progress-labels">
        <span>已完成 {{ completedCount }} 题</span>
        <span>剩余 {{ totalProblems - completedCount }} 题</span>
      </div>
    </div>

    <!-- 今日复习尚未生成 -->
    <div v-if="!hasReview" class="card" style="border-color:var(--accent);background:var(--accent-bg)">
      <div class="card-title mb-3">今日复习</div>
      <p style="color:var(--muted);margin-bottom:var(--space-3);font-size:0.9rem">
        今日复习题目尚未生成。系统每天 00:01 自动为所有同学生成统一的复习题目。
      </p>
      <button class="btn btn-primary w-full" @click="generateReview" :disabled="generating">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {{ generating ? '生成中...' : '立即生成今日复习' }}
      </button>
    </div>

    <!-- 今日复习题目 -->
    <div v-else-if="review && review.problems && review.problems.length > 0" class="card" style="border-color:var(--accent);background:var(--accent-bg)">
      <div class="card-header">
        <div class="flex items-center gap-2">
          <span class="tag tag-ai">今日</span>
          <span class="card-title" style="font-size:0.95rem">今日复习 · 所有同学题目相同</span>
        </div>
      </div>
      <div v-for="(prob, idx) in review.problems" :key="prob.id" class="mb-3" :style="prob.completed ? 'opacity:0.6' : ''">
        <div class="flex items-center gap-2 mb-2">
          <span class="tag" :class="getDiffTag(prob.difficulty)">{{ getDiffLabel(prob.difficulty) }}</span>
          <span style="font-size:0.8rem;color:var(--dim)">{{ prob.chapter }} · {{ prob.type }}</span>
          <span v-if="prob.completed" class="tag tag-basic">已完成</span>
        </div>
        <div class="formula-body" v-html="renderLatex(prob.content)"></div>
        <router-link :to="'/practice?mode=daily&id=' + prob.id" class="btn btn-sm" :class="prob.completed ? 'btn-secondary' : 'btn-primary'" style="margin-top:8px;display:inline-block">
          {{ prob.completed ? '重做' : '做题' }}
        </router-link>
      </div>
    </div>

    <!-- 章节任务 -->
    <div class="card" v-if="mastery && mastery.chapters && mastery.chapters.length > 0">
      <div class="card-title mb-3">章节掌握度</div>
      <div v-for="chapter in mastery.chapters" :key="chapter.name" class="mb-3">
        <div class="flex justify-between mb-1">
          <span style="font-size:0.9rem;font-weight:500">{{ chapter.name }}</span>
          <span style="font-size:0.8rem;color:var(--dim)">{{ chapter.correct }}/{{ chapter.solved }} 正确</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: chapterPercent(chapter) + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3 mb-5" v-if="hasReview">
      <router-link to="/practice" class="btn btn-primary w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        开始练习
      </router-link>
      <router-link to="/formula" class="btn btn-secondary w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        背诵公式
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { renderLatex } from '../utils/latex.js'
import { getMastery } from '../api/mastery.js'
import { getDailyReview, generateDailyReview } from '../api/dailyReview.js'

const loading = ref(true)
const generating = ref(false)
const mastery = ref(null)
const review = ref(null)

const today = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
})

const hasReview = computed(() => {
  return review.value && review.value.problems && review.value.problems.length > 0
})

const totalProblems = computed(() => {
  return review.value?.problems?.length || 0
})

const completedCount = computed(() => {
  return review.value?.completed_count || 0
})

const progressPercent = computed(() => {
  if (totalProblems.value === 0) return 0
  return Math.round((completedCount.value / totalProblems.value) * 100)
})

const reviewSubtitle = computed(() => {
  if (totalProblems.value === 0) return '暂无今日复习题目'
  return `共 ${totalProblems.value} 题 · 预计 ${totalProblems.value * 3} 分钟`
})

const chapterPercent = (chapter) => {
  if (chapter.solved === 0) return 0
  return Math.round((chapter.correct / chapter.solved) * 100)
}

const getDiffTag = (difficulty) => {
  if (difficulty === 'basic') return 'tag-basic'
  if (difficulty === 'advanced') return 'tag-advanced'
  return 'tag-exam'
}

const getDiffLabel = (difficulty) => {
  if (difficulty === 'basic') return '基础'
  if (difficulty === 'advanced') return '强化'
  return '真题'
}

async function generateReview() {
  generating.value = true
  try {
    review.value = await generateDailyReview()
  } catch (err) {
    alert('生成失败：' + (err.response?.data?.error || err.message))
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  try {
    const [m, r] = await Promise.all([
      getMastery().catch(() => null),
      getDailyReview().catch(() => null)
    ])
    mastery.value = m
    review.value = r
  } finally {
    loading.value = false
  }
})
</script>

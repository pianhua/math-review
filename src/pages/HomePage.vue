<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else>
    <h1 class="screen-title">{{ today }}</h1>

    <!-- 今日复习卡片 -->
    <div class="card" style="border-color:var(--accent);background:var(--accent-bg)">
      <div class="card-header">
        <div class="flex items-center gap-2">
          <span class="tag tag-ai">今日</span>
          <span class="card-title" style="font-size:0.95rem">今日复习</span>
        </div>
        <span v-if="quota" style="font-size:0.8rem;color:var(--muted)">
          AI 额度 {{ quota.used }}/5
        </span>
      </div>

      <!-- 未生成状态 -->
      <div v-if="!hasReview && !isSolving">
        <p style="color:var(--muted);margin-bottom:var(--space-3);font-size:0.9rem">
          今日复习题目尚未生成。系统将根据你的薄弱知识点生成个性化复习题目。
        </p>
        <button class="btn btn-primary w-full" @click="generateReview" :disabled="generating">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {{ generating ? '生成中...' : '生成今日复习' }}
        </button>
      </div>

      <!-- 已生成，未开始做题 -->
      <div v-else-if="hasReview && !isSolving && !isComplete">
        <div style="font-size:0.85rem;color:var(--muted);margin-bottom:var(--space-3)">
          共 {{ review.problems.length }} 题 · 预计 {{ review.problems.length * 3 }} 分钟 · 基于你的薄弱知识点
        </div>
        <div class="progress-bar mb-3">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-labels mb-3">
          <span>已完成 {{ review.completed_count }} 题</span>
          <span>剩余 {{ review.problems.length - review.completed_count }} 题</span>
        </div>
        <button class="btn btn-primary w-full" @click="startSolving">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {{ review.completed_count > 0 ? '继续做题' : '开始今日复习' }}
        </button>
      </div>

      <!-- 做题中 -->
      <div v-else-if="isSolving">
        <ProblemCard
          :problems="review.problems"
          :show-mastery="true"
          @complete="onComplete"
          @problem-changed="onProblemChanged"
        />
      </div>

      <!-- 已完成 -->
      <div v-else-if="isComplete" class="text-center" style="padding:var(--space-4) 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="1.5" style="margin-bottom:var(--space-3)">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div style="font-size:1.1rem;font-weight:500;margin-bottom:var(--space-2)">今日复习已完成！</div>
        <div style="font-size:0.85rem;color:var(--muted);margin-bottom:var(--space-3)">
          完成 {{ review.problems.length }} 题，继续加油
        </div>
        <div class="flex gap-2 justify-center">
          <button class="btn btn-secondary btn-sm" @click="resetState">再来一组</button>
          <router-link to="/weak-points" class="btn btn-ghost btn-sm">查看薄弱专项</router-link>
        </div>
      </div>
    </div>

    <!-- 章节掌握度 -->
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

    <!-- 快捷操作 -->
    <div class="flex gap-3 mb-5">
      <router-link to="/practice" class="btn btn-secondary w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        自由练习
      </router-link>
      <router-link to="/formula" class="btn btn-secondary w-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        背诵公式
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMastery } from '../api/mastery.js'
import { getDailyReview, generateDailyReview } from '../api/dailyReview.js'
import ProblemCard from '../components/ProblemCard.vue'

const loading = ref(true)
const generating = ref(false)
const mastery = ref(null)
const review = ref(null)
const quota = ref(null)
const isSolving = ref(false)
const isComplete = ref(false)

const today = computed(() => {
  return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
})

const hasReview = computed(() => {
  return review.value && review.value.problems && review.value.problems.length > 0
})

const progressPercent = computed(() => {
  if (!hasReview.value) return 0
  const total = review.value.problems.length
  const completed = review.value.completed_count || 0
  return Math.round((completed / total) * 100)
})

const chapterPercent = (chapter) => {
  if (chapter.solved === 0) return 0
  return Math.round((chapter.correct / chapter.solved) * 100)
}

async function loadDailyReview() {
  try {
    const result = await getDailyReview()
    review.value = result.review
    quota.value = result.quota
  } catch (err) {
    console.error('Failed to load daily review:', err)
  }
}

async function generateReview() {
  generating.value = true
  try {
    const result = await generateDailyReview()
    review.value = result.review
    quota.value = result.quota
  } catch (err) {
    alert('生成失败：' + (err.response?.data?.error || err.message || '请检查网络连接'))
  } finally {
    generating.value = false
  }
}

function startSolving() {
  isSolving.value = true
  isComplete.value = false
}

function onComplete() {
  isSolving.value = false
  isComplete.value = true
  // Refresh review data to update completed count
  loadDailyReview()
}

function onProblemChanged() {
  // Could track problem changes here if needed
}

function resetState() {
  isSolving.value = false
  isComplete.value = false
  review.value = null
  loadDailyReview()
}

onMounted(async () => {
  try {
    const [m, r] = await Promise.all([
      getMastery().catch(() => null),
      loadDailyReview()
    ])
    mastery.value = m
  } finally {
    loading.value = false
  }
})
</script>

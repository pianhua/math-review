<template>
  <!-- Skeleton Loading -->
  <div v-if="loading" class="skeleton-home">
    <div class="skeleton skeleton-line" style="width:120px;height:24px;margin-bottom:var(--space-5)"></div>
    <div class="skeleton-card">
      <div class="skeleton skeleton-line" style="width:80px;height:16px;margin-bottom:var(--space-3)"></div>
      <div class="skeleton skeleton-line skeleton-line-short" style="height:12px"></div>
      <div class="skeleton skeleton-line" style="width:100%;height:40px;margin-top:var(--space-3);border-radius:var(--radius-md)"></div>
    </div>
    <div class="skeleton-card" style="padding:var(--space-4)">
      <div class="skeleton skeleton-line" style="width:100px;height:16px;margin-bottom:var(--space-3)"></div>
      <div class="skeleton skeleton-line" style="width:100%;height:6px;margin-bottom:var(--space-2)"></div>
      <div class="skeleton skeleton-line" style="width:100%;height:6px;margin-bottom:var(--space-2)"></div>
    </div>
  </div>

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
          <span v-if="generating" class="spinner-white"></span>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          <router-link to="/weak-points" class="btn btn-ghost btn-sm">查看薄弱专项</router-link>
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
          <path d="M9 4v6.5a3.5 3.5 0 1 0 7 0V4"/>
          <line x1="6" y1="4" x2="18" y2="4"/>
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
import { useToast } from '../composables/useToast.js'
import ProblemCard from '../components/ProblemCard.vue'

const { error: toastError } = useToast()

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
    toastError('生成失败：' + (err.response?.data?.error || err.message || '请检查网络连接'))
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
  loadDailyReview()
}

function onProblemChanged() {
  // Could track problem changes here if needed
}

onMounted(async () => {
  try {
    await Promise.all([
      getMastery().catch(() => null),
      loadDailyReview()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.skeleton-home {
  padding-top: var(--space-4);
}

.spinner-white {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

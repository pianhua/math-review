<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else-if="problems.length === 0" class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
    <div>{{ emptyMessage }}</div>
    <router-link v-if="mode === 'daily'" to="/" class="btn btn-primary btn-sm" style="margin-top:var(--space-3)">回首页</router-link>
  </div>
  <div v-else>
    <div class="flex items-center gap-2 mb-3">
      <h1 class="screen-title" style="margin-bottom:0">{{ pageTitle }}</h1>
      <span class="tag" :class="modeTagClass">{{ modeLabel }}</span>
    </div>

    <!-- 模式说明 -->
    <div v-if="mode === 'daily'" class="card" style="padding:var(--space-3);margin-bottom:var(--space-3)">
      <div style="font-size:0.85rem;color:var(--muted)">
        今日复习 · 共 {{ problems.length }} 题
      </div>
    </div>

    <!-- 筛选按钮（仅自由练习模式显示） -->
    <div v-if="mode === 'all'" class="flex gap-2 mb-4" style="flex-wrap:wrap">
      <button class="btn btn-sm" :class="filter === 'all' ? 'btn-primary' : 'btn-secondary'" @click="setFilter('all')">全部</button>
      <button class="btn btn-sm" :class="filter === 'bookmarked' ? 'btn-primary' : 'btn-secondary'" @click="setFilter('bookmarked')">收藏</button>
      <button v-for="chapter in chapters" :key="chapter"
              class="btn btn-sm"
              :class="filter === chapter ? 'btn-primary' : 'btn-secondary'"
              @click="setFilter(chapter)">
        {{ chapter }}
      </button>
    </div>

    <!-- 题目卡片（复用 ProblemCard） -->
    <ProblemCard
      :problems="filteredProblems"
      :show-mastery="mode === 'daily'"
      @complete="onComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblems } from '../api/problems.js'
import { getDailyReview } from '../api/dailyReview.js'
import ProblemCard from '../components/ProblemCard.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const problems = ref([])
const filter = ref('all')

const mode = computed(() => route.query.mode || 'all')

const pageTitle = computed(() => {
  if (mode.value === 'daily') return '今日复习'
  if (mode.value === 'bookmark') return '收藏练习'
  if (mode.value === 'wrong') return '错题重做'
  if (mode.value === 'chapter') return route.query.chapter || '章节练习'
  return '练习'
})

const modeLabel = computed(() => {
  if (mode.value === 'daily') return '今日'
  if (mode.value === 'bookmark') return '收藏'
  if (mode.value === 'wrong') return '错题'
  if (mode.value === 'chapter') return '章节'
  return '自由'
})

const modeTagClass = computed(() => {
  if (mode.value === 'daily') return 'tag-ai'
  if (mode.value === 'wrong') return 'tag-exam'
  return 'tag-basic'
})

const emptyMessage = computed(() => {
  if (mode.value === 'daily') return '今日复习尚未生成'
  if (mode.value === 'bookmark') return '暂无收藏题目'
  if (mode.value === 'wrong') return '暂无错题'
  return '暂无题目'
})

const chapters = computed(() => {
  return [...new Set(problems.value.map(p => p.chapter))]
})

const filteredProblems = computed(() => {
  if (mode.value !== 'all') return problems.value
  if (filter.value === 'all') return problems.value
  if (filter.value === 'bookmarked') return problems.value.filter(p => p.bookmarked)
  return problems.value.filter(p => p.chapter === filter.value)
})

const setFilter = (f) => {
  filter.value = f
}

const onComplete = () => {
  if (mode.value === 'daily') {
    router.push('/')
  }
}

onMounted(async () => {
  try {
    if (mode.value === 'daily') {
      const result = await getDailyReview()
      problems.value = result.review?.problems || []
    } else {
      problems.value = await getProblems(mode.value, route.query.chapter)
    }
  } catch (err) {
    console.error('Failed to load problems:', err)
  } finally {
    loading.value = false
  }
})
</script>

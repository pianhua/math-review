<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else>
    <h1 class="screen-title">掌握度</h1>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-box">
        <div class="stat-value">{{ mastery.totalSolved }}</div>
        <div class="stat-label">总做题数</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">{{ mastery.accuracy }}%</div>
        <div class="stat-label">正确率</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">{{ mastery.streakDays }}</div>
        <div class="stat-label">连续打卡</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">{{ totalHours }}</div>
        <div class="stat-label">学习时长</div>
      </div>
    </div>

    <!-- 雷达图 -->
    <div class="radar-container" v-if="mastery.chapters && mastery.chapters.length > 0">
      <div class="card-title mb-3">章节掌握度</div>
      <svg class="radar-svg" :viewBox="`0 0 ${size} ${size}`">
        <polygon v-for="level in [0.25, 0.5, 0.75, 1]" :key="level"
                 :points="getGridPoints(level)"
                 fill="none" stroke="var(--border)" stroke-width="1"/>
        <line v-for="(chapter, i) in mastery.chapters" :key="'axis-'+i"
              :x1="cx" :y1="cy"
              :x2="getPointX(i, r)" :y2="getPointY(i, r)"
              stroke="var(--border)" stroke-width="1"/>
        <polygon :points="getDataPoints()" fill="rgba(201,100,66,0.15)" stroke="var(--accent)" stroke-width="2"/>
        <circle v-for="(chapter, i) in mastery.chapters" :key="'point-'+i"
                :cx="getPointX(i, getDataRadius(chapter))"
                :cy="getPointY(i, getDataRadius(chapter))"
                r="4" fill="var(--accent)"/>
        <text v-for="(chapter, i) in mastery.chapters" :key="'label-'+i"
              :x="getLabelX(i)" :y="getLabelY(i)"
              text-anchor="middle" dominant-baseline="middle"
              font-size="11" fill="var(--muted)">
          {{ chapter.name }}
        </text>
      </svg>
    </div>

    <!-- 章节详情 -->
    <div class="card" v-if="mastery.chapters && mastery.chapters.length > 0">
      <div class="card-title mb-3">各章节详情</div>
      <div v-for="chapter in mastery.chapters" :key="chapter.name" class="mb-3">
        <div class="flex justify-between mb-1">
          <span style="font-size:0.9rem;font-weight:500">{{ chapter.name }}</span>
          <span style="font-size:0.8rem;color:var(--dim)">{{ chapter.correct }}/{{ chapter.solved }} ({{ chapterPercent(chapter) }}%)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: chapterPercent(chapter) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMastery } from '../api/mastery.js'

const loading = ref(true)
const mastery = ref({
  totalSolved: 0,
  totalCorrect: 0,
  accuracy: 0,
  streakDays: 0,
  totalStudyMinutes: 0,
  chapters: []
})

const size = 280
const cx = size / 2
const cy = size / 2
const r = 100

const totalHours = computed(() => {
  const minutes = mastery.value.totalStudyMinutes || 0
  return Math.floor(minutes / 60) + 'h' + (minutes % 60) + 'm'
})

const maxVal = computed(() => {
  if (!mastery.value.chapters || mastery.value.chapters.length === 0) return 1
  return Math.max(...mastery.value.chapters.map(c => Math.max(c.solved, c.totalProblems || 1)))
})

const getGridPoints = (level) => {
  const val = maxVal.value * level
  if (!mastery.value.chapters) return ''
  return mastery.value.chapters.map((_, i) => {
    const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
    const dist = (val / maxVal.value) * r
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`
  }).join(' ')
}

const getPointX = (i, dist) => {
  if (!mastery.value.chapters) return cx
  const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
  return cx + dist * Math.cos(angle)
}

const getPointY = (i, dist) => {
  if (!mastery.value.chapters) return cy
  const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
  return cy + dist * Math.sin(angle)
}

const getDataRadius = (chapter) => {
  const accuracy = chapter.solved > 0 ? (chapter.correct / chapter.solved) : 0
  return accuracy * r
}

const getDataPoints = () => {
  if (!mastery.value.chapters) return ''
  return mastery.value.chapters.map((c, i) => {
    const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
    const dist = (c.correct / maxVal.value) * r
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`
  }).join(' ')
}

const getLabelX = (i) => {
  if (!mastery.value.chapters) return cx
  const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
  return cx + (r + 22) * Math.cos(angle)
}

const getLabelY = (i) => {
  if (!mastery.value.chapters) return cy
  const angle = (Math.PI * 2 * i / mastery.value.chapters.length) - Math.PI / 2
  return cy + (r + 22) * Math.sin(angle)
}

const chapterPercent = (chapter) => {
  if (chapter.solved === 0) return 0
  return Math.round((chapter.correct / chapter.solved) * 100)
}

onMounted(async () => {
  try {
    const data = await getMastery()
    mastery.value = data
  } catch (err) {
    console.error('Failed to load mastery:', err)
  } finally {
    loading.value = false
  }
})
</script>

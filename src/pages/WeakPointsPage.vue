<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else>
    <div class="flex items-center gap-2 mb-3">
      <h1 class="screen-title" style="margin-bottom:0">薄弱专项</h1>
      <span class="tag tag-exam">薄弱</span>
    </div>

    <!-- 额度信息 -->
    <div class="card" style="padding:var(--space-3);margin-bottom:var(--space-3)">
      <div class="flex justify-between items-center">
        <span style="font-size:0.9rem">今日 AI 生成剩余额度</span>
        <span style="font-family:var(--font-display);font-size:1.4rem;color:var(--accent)">
          {{ quota?.remaining ?? 5 }}/5
        </span>
      </div>
    </div>

    <!-- 无薄弱章节 -->
    <div v-if="weakChapters.length === 0 && !isSolving" class="card" style="text-align:center;padding:var(--space-8)">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:var(--space-3);opacity:0.4">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
      <div style="color:var(--dim)">暂无薄弱章节，继续做题积累数据</div>
    </div>

    <!-- 薄弱章节列表 -->
    <div v-if="!isSolving">
      <div v-for="chapter in weakChapters" :key="chapter.chapter" class="card mb-3">
        <div class="flex justify-between items-center mb-3" style="cursor:pointer" @click="toggleChapter(chapter.chapter)">
          <div class="flex items-center gap-2">
            <span style="font-size:1.1rem">{{ chapter.chapter }}</span>
            <span class="tag tag-exam">{{ chapter.weak_count }} 题</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{transform: expandedChapters[chapter.chapter] ? 'rotate(180deg)' : '', transition: 'transform 0.2s'}">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <div v-if="expandedChapters[chapter.chapter]" class="mb-3">
          <div v-for="prob in problemsByChapter[chapter.chapter]" :key="prob.id" class="mb-3" style="padding:var(--space-3);background:var(--bg);border-radius:var(--radius-md)">
            <div class="flex items-center gap-2 mb-2">
              <span class="tag" :class="prob.mastery === 'weak' ? 'tag-exam' : 'tag-advanced'">
                {{ prob.mastery === 'weak' ? '薄弱' : '不熟练' }}
              </span>
              <span style="font-size:0.8rem;color:var(--dim)">{{ prob.source }}</span>
            </div>
            <div class="formula-body" style="margin-bottom:8px" v-html="renderLatex(prob.content)"></div>
            <button class="btn btn-sm btn-primary" @click="startPractice(prob)">练习此题</button>
          </div>
        </div>
      </div>

      <!-- 生成薄弱题目按钮 -->
      <button v-if="weakChapters.length > 0" class="btn btn-primary w-full mb-5" @click="generateWeakProblems" :disabled="generating || (quota?.remaining ?? 5) <= 0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {{ generating ? '生成中...' : '生成薄弱专项题目' }}
      </button>
    </div>

    <!-- 做题中 -->
    <div v-if="isSolving && currentProblems.length > 0">
      <ProblemCard
        :problems="currentProblems"
        :show-mastery="true"
        @complete="onComplete"
      />
      <button class="btn btn-ghost btn-sm mt-3" @click="isSolving = false">返回列表</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { renderLatex } from '../utils/latex.js'
import { getWeakPoints, generateWeakPointReview } from '../api/weakPoints.js'
import ProblemCard from '../components/ProblemCard.vue'

const loading = ref(true)
const generating = ref(false)
const weakChapters = ref([])
const problemsByChapter = ref({})
const quota = ref(null)
const isSolving = ref(false)
const currentProblems = ref([])
const expandedChapters = ref({})

function toggleChapter(chapter) {
  expandedChapters.value[chapter] = !expandedChapters.value[chapter]
}

function startPractice(problem) {
  currentProblems.value = [problem]
  isSolving.value = true
}

async function generateWeakProblems() {
  generating.value = true
  try {
    const result = await generateWeakPointReview()
    if (result.problems && result.problems.length > 0) {
      currentProblems.value = result.problems
      isSolving.value = true
    }
    quota.value = result.quota
  } catch (err) {
    alert('生成失败：' + (err.response?.data?.error || err.message || '请检查网络连接'))
  } finally {
    generating.value = false
  }
}

function onComplete() {
  isSolving.value = false
  currentProblems.value = []
  loadWeakPoints()
}

async function loadWeakPoints() {
  try {
    const data = await getWeakPoints()
    weakChapters.value = data.weak_chapters || []
    problemsByChapter.value = data.problems_by_chapter || {}
    quota.value = data.quota
    // Expand first chapter by default
    if (weakChapters.value.length > 0) {
      expandedChapters.value[weakChapters.value[0].chapter] = true
    }
  } catch (err) {
    console.error('Failed to load weak points:', err)
  }
}

onMounted(async () => {
  await loadWeakPoints()
  loading.value = false
})
</script>

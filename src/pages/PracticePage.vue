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
        今日复习 · 共 {{ problems.length }} 题 · 所有同学题目相同
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

    <!-- 题目卡片 -->
    <div class="problem-card">
      <div class="problem-header">
        <span class="tag" :class="getDiffTag(currentProblem.difficulty)">{{ getDiffLabel(currentProblem.difficulty) }}</span>
        <span class="tag tag-source">{{ currentProblem.source }}</span>
        <span class="tag" style="background:var(--accent-bg);color:var(--accent)">{{ currentProblem.type }}</span>
      </div>

      <div class="problem-content" v-html="renderLatex(currentProblem.content)"></div>

      <!-- 选择题 -->
      <div v-if="isChoice" class="problem-options">
        <button v-for="opt in currentProblem.options" :key="opt.label"
                class="option-row"
                :class="getOptionClass(opt.label)"
                :disabled="answered"
                @click="selectOption(opt.label)">
          <span class="option-label">{{ opt.label }}</span>
          <span v-html="renderLatex(opt.text)"></span>
        </button>
      </div>

      <!-- 填空/解答题输入区 -->
      <div v-else class="mb-3">
        <div v-if="!answerRevealed">
          <textarea
            v-if="isEssay"
            v-model="userAnswer"
            class="problem-input"
            rows="6"
            placeholder="在此输入你的解题过程..."
          ></textarea>
          <input
            v-else
            v-model="userAnswer"
            class="problem-input"
            type="text"
            placeholder="在此输入你的答案..."
          >
          <button class="btn btn-primary w-full mt-2" @click="revealAnswer" :disabled="!userAnswer.trim()">
            提交答案
          </button>
        </div>
      </div>

      <!-- 答案与解析 -->
      <div v-if="showExplanation" class="answer-panel">
        <!-- 知识点 -->
        <div v-if="currentProblem.knowledge_point" class="knowledge-block">
          <div class="answer-label">知识点</div>
          <div class="knowledge-content" v-html="renderLatex(currentProblem.knowledge_point)"></div>
        </div>

        <!-- 正确答案 -->
        <div class="answer-block">
          <div class="answer-label">正确答案</div>
          <div class="answer-content" v-html="renderLatex(currentProblem.correct)"></div>
        </div>

        <!-- 解析 -->
        <div class="explanation-block">
          <div class="answer-label">解析</div>
          <div v-html="renderLatex(currentProblem.explanation)"></div>
        </div>

        <!-- 非选择题：自评（未评分前显示） -->
        <div v-if="!isChoice && selfRatedCorrect === null" class="flex gap-2 mt-3">
          <div style="font-size:0.85rem;color:var(--muted);margin-right:auto;padding-top:6px">
            请对照答案判断自己是否做对
          </div>
          <button class="btn btn-sm btn-primary" @click="selfRate(true)">我做对了</button>
          <button class="btn btn-sm btn-secondary" @click="selfRate(false)">我做错了</button>
        </div>

        <!-- 下一题 / 收藏 -->
        <div v-if="isChoice || selfRatedCorrect !== null" class="flex gap-2 mt-3">
          <button class="btn btn-secondary btn-sm" @click="nextOrReset">{{ isLast ? '完成' : '下一题' }}</button>
          <button class="btn btn-ghost btn-sm" @click="toggleBookmark(currentProblem.id)">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentProblem.bookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {{ currentProblem.bookmarked ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>

      <!-- 导航 -->
      <div v-if="!answered" class="flex justify-between items-center mt-2">
        <span style="font-size:0.8rem;color:var(--dim)">第 {{ currentProblemIdx + 1 }} / {{ filteredProblems.length }} 题</span>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="prevProblem" :disabled="currentProblemIdx === 0">上一题</button>
          <button class="btn btn-ghost btn-sm" @click="nextProblem" :disabled="currentProblemIdx === filteredProblems.length - 1">下一题</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderLatex } from '../utils/latex.js'
import { getProblems } from '../api/problems.js'
import { getDailyReview } from '../api/dailyReview.js'
import { addBookmark, removeBookmark } from '../api/bookmarks.js'
import { submitAttempt } from '../api/attempts.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const problems = ref([])
const filter = ref('all')
const currentProblemIdx = ref(0)
const selectedOption = ref(null)
const showExplanation = ref(false)
const userAnswer = ref('')
const answerRevealed = ref(false)
const selfRatedCorrect = ref(null)

// Mode from URL: daily, all, chapter, bookmark, wrong
const mode = computed(() => route.query.mode || 'all')
const targetId = computed(() => route.query.id || null)

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

const currentProblem = computed(() => {
  return filteredProblems.value[currentProblemIdx.value] || {}
})

const isLast = computed(() => {
  return currentProblemIdx.value === filteredProblems.value.length - 1
})

const isChoice = computed(() => {
  return (currentProblem.value.options?.length || 0) > 0
})

const isEssay = computed(() => {
  return currentProblem.value.type === '证明题' || currentProblem.value.type === '解答题'
})

const answered = computed(() => {
  if (isChoice.value) return selectedOption.value !== null
  return answerRevealed.value && selfRatedCorrect.value !== null
})

const setFilter = (f) => {
  filter.value = f
  currentProblemIdx.value = 0
  resetProblem()
}

const selectOption = async (label) => {
  selectedOption.value = label
  showExplanation.value = true

  const isCorrect = label === currentProblem.value.correct
  try {
    await submitAttempt(currentProblem.value.id, label, isCorrect)
  } catch (err) {
    console.error('Submit attempt failed:', err)
  }
}

const revealAnswer = () => {
  answerRevealed.value = true
  showExplanation.value = true
}

const selfRate = async (isCorrect) => {
  selfRatedCorrect.value = isCorrect
  try {
    await submitAttempt(currentProblem.value.id, userAnswer.value, isCorrect)
  } catch (err) {
    console.error('Submit attempt failed:', err)
  }
}

const resetProblem = () => {
  selectedOption.value = null
  showExplanation.value = false
  userAnswer.value = ''
  answerRevealed.value = false
  selfRatedCorrect.value = null
}

const nextProblem = () => {
  currentProblemIdx.value++
  resetProblem()
}

const prevProblem = () => {
  currentProblemIdx.value--
  resetProblem()
}

const nextOrReset = () => {
  if (isLast.value) {
    // Last problem: go back or show completion
    if (mode.value === 'daily') {
      router.push('/')
    } else {
      // Show completion and reset
      if (confirm('本组题目已完成，是否重新开始？')) {
        resetProblem()
        currentProblemIdx.value = 0
      }
    }
  } else {
    nextProblem()
  }
}

const toggleBookmark = async (id) => {
  const prob = problems.value.find(p => p.id === id)
  if (!prob) return

  try {
    if (prob.bookmarked) {
      await removeBookmark(id, 'problem')
      prob.bookmarked = false
    } else {
      await addBookmark(id, 'problem')
      prob.bookmarked = true
    }
  } catch (err) {
    console.error('Bookmark error:', err)
  }
}

const getOptionClass = (label) => {
  if (!selectedOption.value) return ''
  if (selectedOption.value === label) {
    return selectedOption.value === currentProblem.value.correct ? 'correct' : 'wrong'
  }
  return label === currentProblem.value.correct ? 'correct' : ''
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

onMounted(async () => {
  try {
    if (mode.value === 'daily') {
      const review = await getDailyReview()
      problems.value = review?.problems || []
    } else {
      problems.value = await getProblems(mode.value, route.query.chapter)
    }

    // If id param provided, jump to that problem
    if (targetId.value && problems.value.length > 0) {
      const idx = problems.value.findIndex(p => p.id === targetId.value)
      if (idx !== -1) {
        currentProblemIdx.value = idx
      }
    }
  } catch (err) {
    console.error('Failed to load problems:', err)
  } finally {
    loading.value = false
  }
})
</script>

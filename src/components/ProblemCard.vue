<template>
  <div class="problem-card">
    <!-- 题目头部 -->
    <div class="problem-header">
      <span class="tag" :class="getDiffTag(currentProblem.difficulty)">{{ getDiffLabel(currentProblem.difficulty) }}</span>
      <span class="tag tag-source">{{ currentProblem.source }}</span>
      <span class="tag" style="background:var(--accent-bg);color:var(--accent)">{{ currentProblem.type }}</span>
    </div>

    <!-- 题目内容 -->
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

      <!-- 掌握程度标记（Issue #2）-->
      <div v-if="showMastery" class="mastery-block mt-3">
        <div class="answer-label">掌握程度</div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm" :class="currentMastery === 'mastered' ? 'btn-primary' : 'btn-secondary'" @click="markMastery('mastered')">
            已掌握
          </button>
          <button class="btn btn-sm" :class="currentMastery === 'unfamiliar' ? 'btn-primary' : 'btn-secondary'" @click="markMastery('unfamiliar')">
            不熟练
          </button>
          <button class="btn btn-sm" :class="currentMastery === 'weak' ? 'btn-primary' : 'btn-secondary'" @click="markMastery('weak')">
            薄弱
          </button>
        </div>
      </div>

      <!-- 非选择题：自评 -->
      <div v-if="!isChoice && selfRatedCorrect === null" class="flex gap-2 mt-3">
        <div style="font-size:0.85rem;color:var(--muted);margin-right:auto;padding-top:6px">
          请对照答案判断自己是否做对
        </div>
        <button class="btn btn-sm btn-primary" @click="selfRate(true)">我做对了</button>
        <button class="btn btn-sm btn-secondary" @click="selfRate(false)">我做错了</button>
      </div>

      <!-- 下一题 / 收藏 -->
      <div v-if="isChoice || selfRatedCorrect !== null" class="flex gap-2 mt-3">
        <button class="btn btn-secondary btn-sm" @click="nextOrComplete">{{ isLast ? '完成' : '下一题' }}</button>
        <button class="btn btn-ghost btn-sm" @click="toggleBookmark">
          <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentProblem.bookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {{ currentProblem.bookmarked ? '已收藏' : '收藏' }}
        </button>
      </div>
    </div>

    <!-- 导航 -->
    <div v-if="!answered" class="flex justify-between items-center mt-2">
      <span style="font-size:0.8rem;color:var(--dim)">第 {{ currentIdx + 1 }} / {{ problems.length }} 题</span>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" @click="prev" :disabled="currentIdx === 0">上一题</button>
        <button class="btn btn-ghost btn-sm" @click="next" :disabled="currentIdx === problems.length - 1">下一题</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { renderLatex } from '../utils/latex.js'
import { addBookmark, removeBookmark } from '../api/bookmarks.js'
import { submitAttempt, getMastery } from '../api/attempts.js'
import { markMastery as apiMarkMastery } from '../api/weakPoints.js'

const props = defineProps({
  problems: { type: Array, required: true },
  showMastery: { type: Boolean, default: false }
})

const emit = defineEmits(['complete', 'problem-changed'])

const currentIdx = ref(0)
const selectedOption = ref(null)
const showExplanation = ref(false)
const userAnswer = ref('')
const answerRevealed = ref(false)
const selfRatedCorrect = ref(null)
const currentMastery = ref(null)

const currentProblem = computed(() => {
  return props.problems[currentIdx.value] || {}
})

const isLast = computed(() => {
  return currentIdx.value === props.problems.length - 1
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

// Watch for problem changes to reset state and fetch mastery
watch(currentProblem, async (newProblem) => {
  if (newProblem?.id) {
    resetProblem()
    if (props.showMastery) {
      try {
        const res = await getMastery(newProblem.id)
        currentMastery.value = res.mastery
      } catch (e) {
        currentMastery.value = null
      }
    }
    emit('problem-changed', currentIdx.value)
  }
}, { immediate: true })

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

const markMastery = async (level) => {
  try {
    await apiMarkMastery(currentProblem.value.id, level)
    currentMastery.value = level
  } catch (err) {
    console.error('Mark mastery failed:', err)
  }
}

const resetProblem = () => {
  selectedOption.value = null
  showExplanation.value = false
  userAnswer.value = ''
  answerRevealed.value = false
  selfRatedCorrect.value = null
  currentMastery.value = null
}

const next = () => {
  if (currentIdx.value < props.problems.length - 1) {
    currentIdx.value++
  }
}

const prev = () => {
  if (currentIdx.value > 0) {
    currentIdx.value--
  }
}

const nextOrComplete = () => {
  if (isLast.value) {
    emit('complete')
  } else {
    next()
  }
}

const toggleBookmark = async () => {
  const prob = currentProblem.value
  if (!prob) return

  try {
    if (prob.bookmarked) {
      await removeBookmark(prob.id, 'problem')
      prob.bookmarked = false
    } else {
      await addBookmark(prob.id, 'problem')
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
</script>

<style scoped>
.mastery-block {
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}
</style>

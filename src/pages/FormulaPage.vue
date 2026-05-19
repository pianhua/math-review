<template>
  <div v-if="loading" class="empty-state">加载中...</div>
  <div v-else-if="error" class="empty-state">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    <div>加载失败</div>
    <div style="font-size:0.85rem;color:var(--dim);margin-top:4px">{{ error }}</div>
  </div>
  <div v-else>
    <h1 class="screen-title">公式 · 知识点</h1>

    <!-- 筛选按钮 -->
    <div class="flex gap-2 mb-4" style="flex-wrap:wrap">
      <button class="btn btn-sm" :class="filter === 'all' ? 'btn-primary' : 'btn-secondary'" @click="filter = 'all'">全部</button>
      <button class="btn btn-sm" :class="filter === 'bookmarked' ? 'btn-primary' : 'btn-secondary'" @click="filter = 'bookmarked'">收藏</button>
      <button v-for="chapter in chapters" :key="chapter"
              class="btn btn-sm"
              :class="filter === chapter ? 'btn-primary' : 'btn-secondary'"
              @click="filter = chapter">
        {{ chapter }}
      </button>
    </div>

    <!-- 公式列表 -->
    <div v-for="formula in filteredFormulas" :key="formula.id" class="formula-card">
      <div class="formula-header">
        <div>
          <div class="formula-title">{{ formula.title }}</div>
          <div class="formula-chapter">{{ formula.chapter }}</div>
        </div>
        <button class="bookmark-btn" :class="{ bookmarked: formula.bookmarked }" @click="toggleBookmark(formula.id)">
          <svg width="20" height="20" viewBox="0 0 24 24" :fill="formula.bookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>
      <div class="formula-body" v-html="renderLatex(formula.latex, true)"></div>
      <div class="formula-desc" v-html="renderLatex(formula.description)"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { renderLatex } from '../utils/latex.js'
import { getFormulas } from '../api/formulas.js'
import { addBookmark, removeBookmark } from '../api/bookmarks.js'

const loading = ref(true)
const error = ref('')
const formulas = ref([])
const filter = ref('all')

const chapters = computed(() => {
  return [...new Set(formulas.value.map(f => f.chapter))]
})

const filteredFormulas = computed(() => {
  if (filter.value === 'all') return formulas.value
  if (filter.value === 'bookmarked') return formulas.value.filter(f => f.bookmarked)
  return formulas.value.filter(f => f.chapter === filter.value)
})

const toggleBookmark = async (id) => {
  const formula = formulas.value.find(f => f.id === id)
  if (!formula) return

  try {
    if (formula.bookmarked) {
      await removeBookmark(id, 'formula')
      formula.bookmarked = false
    } else {
      await addBookmark(id, 'formula')
      formula.bookmarked = true
    }
  } catch (err) {
    console.error('Bookmark error:', err)
  }
}

onMounted(async () => {
  try {
    formulas.value = await getFormulas()
  } catch (err) {
    error.value = err.response?.data?.error || err.message || '请检查网络连接'
    console.error('Failed to load formulas:', err)
  } finally {
    loading.value = false
  }
})
</script>

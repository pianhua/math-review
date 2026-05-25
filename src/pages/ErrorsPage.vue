<template>
  <div v-if="loading" class="empty-state">
    <div class="skeleton-home">
      <div class="skeleton-card" style="padding:var(--space-4)">
        <div class="skeleton skeleton-line" style="width:60px;height:24px;margin-bottom:var(--space-2)"></div>
        <div class="skeleton skeleton-line skeleton-line-short" style="height:12px"></div>
      </div>
      <div class="skeleton-card" style="padding:var(--space-4)">
        <div class="skeleton skeleton-line" style="width:100%;height:14px;margin-bottom:var(--space-2)"></div>
        <div class="skeleton skeleton-line skeleton-line-short" style="height:12px"></div>
      </div>
    </div>
  </div>
  <div v-else>
    <h1 class="screen-title">错题本</h1>

    <!-- 统计 -->
    <div class="stats-grid mb-4">
      <div class="stat-box">
        <div class="stat-value">{{ errors.length }}</div>
        <div class="stat-label">错题总数</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">{{ pendingCount }}</div>
        <div class="stat-label">待复习</div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex gap-2 mb-4" style="flex-wrap:wrap">
      <button class="btn btn-sm" :class="filter === 'all' ? 'btn-primary' : 'btn-secondary'" @click="filter = 'all'">全部</button>
      <button v-for="chapter in chapters" :key="chapter"
              class="btn btn-sm"
              :class="filter === chapter ? 'btn-primary' : 'btn-secondary'"
              @click="filter = chapter">
        {{ chapter }}
      </button>
    </div>

    <!-- 错题列表 -->
    <div v-for="error in filteredErrors" :key="error.id"
         class="list-item list-item-expandable"
         @click="toggleExpand(error.id)">
      <div class="list-item-left">
        <div class="list-item-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <div class="list-item-title">{{ error.chapter }}</div>
          <div class="list-item-meta">{{ error.source }} · 错选 {{ error.wrong_answer }} · 正解 {{ error.correct }} · {{ formatDate(error.created_at) }}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="tag" :class="error.review_count > 0 ? 'tag-basic' : 'tag-exam'">
          {{ error.review_count > 0 ? '已复习 ' + error.review_count + ' 次' : '待复习' }}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" stroke-width="2"
             :style="{ transform: expanded[error.id] ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- 展开详情 -->
    <template v-for="error in filteredErrors" :key="'detail-'+error.id">
      <Transition name="expand">
        <div v-if="expanded[error.id] && error.problem_content" class="list-item-detail">
          <div style="font-size:0.75rem;font-weight:600;color:var(--dim);margin-bottom:var(--space-2)">题目内容</div>
          <div class="formula-body" v-html="renderLatex(error.problem_content)"></div>
          <div v-if="error.explanation" style="margin-top:var(--space-3)">
            <div style="font-size:0.75rem;font-weight:600;color:var(--dim);margin-bottom:var(--space-2)">解析</div>
            <div style="font-size:0.9rem;color:var(--muted);line-height:1.7" v-html="renderLatex(error.explanation)"></div>
          </div>
        </div>
      </Transition>
    </template>

    <div v-if="filteredErrors.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <div>暂无错题，继续加油！</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getErrors } from '../api/errors.js'
import { renderLatex } from '../utils/latex.js'

const loading = ref(true)
const errors = ref([])
const filter = ref('all')
const expanded = ref({})

const chapters = computed(() => {
  return [...new Set(errors.value.map(e => e.chapter))]
})

const filteredErrors = computed(() => {
  if (filter.value === 'all') return errors.value
  return errors.value.filter(e => e.chapter === filter.value)
})

const pendingCount = computed(() => {
  return errors.value.filter(e => e.review_count === 0).length
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function toggleExpand(id) {
  expanded.value[id] = !expanded.value[id]
}

onMounted(async () => {
  try {
    errors.value = await getErrors()
  } catch (err) {
    console.error('Failed to load errors:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.skeleton-home {
  padding-top: var(--space-4);
}
</style>

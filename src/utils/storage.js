// ============================================================
//   本地存储工具
// ============================================================

import { MATH_DATA } from '../data/mathData'

const Storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('mathreview:' + key)
      return v ? JSON.parse(v) : fallback
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem('mathreview:' + key, JSON.stringify(value))
    } catch {}
  }
}

// 加载合并数据
export function loadData() {
  const data = JSON.parse(JSON.stringify(MATH_DATA))
  
  // 恢复公式收藏
  const bookmarks = Storage.get('bookmarks', {})
  data.formulas.forEach(f => {
    if (bookmarks[f.id]) f.bookmarked = true
  })
  
  // 恢复题目收藏
  const problemBookmarks = Storage.get('problemBookmarks', {})
  data.problems.forEach(p => {
    if (problemBookmarks[p.id]) p.bookmarked = true
  })
  
  return data
}

// 保存公式收藏
export function saveBookmarks(bookmarks) {
  Storage.set('bookmarks', bookmarks)
}

// 保存题目收藏
export function saveProblemBookmarks(bookmarks) {
  Storage.set('problemBookmarks', bookmarks)
}
<template>
  <div class="app-shell">
    <!-- 移动端顶部栏 -->
    <header class="top-header" v-if="auth.isLoggedIn">
      <div class="brand">考研数学</div>
      <div class="header-actions">
        <span v-if="auth.user" class="user-name">{{ auth.user.username }}</span>
        <button class="btn btn-ghost" @click="toggleTheme" aria-label="切换主题">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
        <button class="btn btn-ghost" @click="() => { auth.logout(); router.push('/login') }" aria-label="退出登录">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 平板侧边栏 -->
    <aside class="tablet-sidebar" v-if="auth.isLoggedIn">
      <div class="sidebar-brand">考研数学</div>
      <router-link v-for="tab in tabs" :key="tab.path"
                   :to="tab.path"
                   class="sidebar-nav-item"
                   :class="{ active: $route.path === tab.path }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="tab.icon"></svg>
        {{ tab.label }}
      </router-link>
      <div class="sidebar-divider"></div>
      <div class="sidebar-theme-toggle">
        <button class="sidebar-nav-item" @click="toggleTheme">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          主题
        </button>
      </div>
    </aside>

    <!-- 页面内容 -->
    <main class="screen" :class="{ 'screen-authed': auth.isLoggedIn }">
      <router-view />
    </main>

    <!-- 移动端底部导航 -->
    <nav class="bottom-nav" v-if="auth.isLoggedIn">
      <router-link v-for="tab in tabs" :key="tab.path"
                   :to="tab.path"
                   class="tab-btn"
                   :class="{ active: $route.path === tab.path }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="tab.icon"></svg>
        <span>{{ tab.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

watch(() => auth.isLoggedIn, (loggedIn) => {
  if (!loggedIn && route.meta.requiresAuth) {
    router.push('/login')
  }
})

const tabs = [
  { path: '/', label: '首页', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { path: '/formula', label: '公式', icon: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>' },
  { path: '/practice', label: '练习', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
  { path: '/errors', label: '错题', icon: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
  { path: '/mastery', label: '掌握', icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' }
]

const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme')
  const next = current === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('mathreview:theme', next)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('mathreview:theme')
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme)
  }
})
</script>

<style>
.user-name {
  font-size: 0.85rem;
  color: var(--muted);
  margin-right: var(--space-2);
}

.screen-authed {
  display: block !important;
}

.router-link-active {
  text-decoration: none;
  color: inherit;
}
</style>

<template>
  <div class="app-shell">
    <!-- Toast 通知 -->
    <template v-for="toast in toasts" :key="toast.id">
      <Teleport to="body">
        <Transition name="toast">
          <div v-if="toast.visible" class="toast-container" :class="'toast-' + toast.type">
            <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span class="toast-msg">{{ toast.message }}</span>
          </div>
        </Transition>
      </Teleport>
    </template>

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
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
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
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import { useToast } from './composables/useToast.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { toasts } = useToast()

import { watch } from 'vue'
watch(() => auth.isLoggedIn, (loggedIn) => {
  if (!loggedIn && route.meta.requiresAuth) {
    router.push('/login')
  }
})

const tabs = [
  { path: '/', label: '首页', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
  { path: '/weak-points', label: '薄弱', icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>' },
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

/* Toast */
.toast-container {
  position: fixed;
  top: calc(var(--header-height, 52px) + var(--safe-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: none;
  max-width: calc(100vw - 32px);
  backdrop-filter: blur(12px);
}

.toast-info {
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  color: var(--fg);
  border: 1px solid var(--border);
}

.toast-success {
  background: rgba(61, 122, 90, 0.92);
  color: #fff;
}

.toast-error {
  background: rgba(181, 51, 51, 0.92);
  color: #fff;
}

.toast-msg {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

/* Page transition */
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-leave-to {
  opacity: 0;
}
</style>

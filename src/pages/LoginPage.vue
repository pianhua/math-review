<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">登录</h1>
      <p class="auth-subtitle">继续你的考研数学复习之旅</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="输入用户名" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="输入密码" required />
        </div>

        <Transition name="slide">
          <div v-if="error" class="error-msg">{{ error }}</div>
        </Transition>

        <button type="submit" class="btn btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          {{ auth.loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="auth-switch">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''
  const result = await auth.login(username.value, password.value)
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}
.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
.auth-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: var(--space-1);
}
.auth-subtitle {
  color: var(--dim);
  font-size: 0.9rem;
  margin-bottom: var(--space-5);
}
.form-group {
  margin-bottom: var(--space-4);
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: var(--space-1);
}
.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg);
  color: var(--fg);
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}
.error-msg {
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: rgba(181, 51, 51, 0.08);
  border-radius: var(--radius-sm);
}
.auth-switch {
  text-align: center;
  margin-top: var(--space-4);
  font-size: 0.9rem;
  color: var(--dim);
}
.auth-switch a {
  color: var(--accent);
  text-decoration: none;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: var(--space-1);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.slide-enter-active {
  transition: all 0.2s ease-out;
}
.slide-leave-active {
  transition: all 0.15s ease-in;
}
.slide-enter-from {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin: 0;
  padding: 0;
}
</style>

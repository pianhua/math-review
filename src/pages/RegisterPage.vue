<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">注册</h1>
      <p class="auth-subtitle">开启你的考研数学复习计划</p>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="3-20 个字符" required />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少 6 位" required />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn btn-primary w-full" :disabled="auth.loading">
          {{ auth.loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <p class="auth-switch">
        已有账号？<router-link to="/login">立即登录</router-link>
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

async function handleRegister() {
  if (username.value.length < 3) {
    error.value = '用户名至少需要 3 个字符'
    return
  }
  if (password.value.length < 6) {
    error.value = '密码至少需要 6 位'
    return
  }
  error.value = ''
  const result = await auth.register(username.value, password.value)
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
}
.form-group input:focus {
  outline: none;
  border-color: var(--accent);
}
.error-msg {
  color: var(--danger);
  font-size: 0.85rem;
  margin-bottom: var(--space-3);
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
</style>

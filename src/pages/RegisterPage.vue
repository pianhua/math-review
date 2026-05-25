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
          <input v-model="password" type="password" placeholder="至少 6 位" required @input="checkStrength" />
          <div v-if="password.length > 0" class="strength-bar">
            <div class="strength-fill" :class="strengthClass" :style="{ width: strengthPercent + '%' }"></div>
          </div>
          <div v-if="password.length > 0" class="strength-label" :class="strengthClass">{{ strengthText }}</div>
        </div>

        <Transition name="slide">
          <div v-if="error" class="error-msg">{{ error }}</div>
        </Transition>

        <button type="submit" class="btn btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')

const strengthLevel = ref(0)

const checkStrength = () => {
  let score = 0
  if (password.value.length >= 6) score++
  if (password.value.length >= 10) score++
  if (/[A-Z]/.test(password.value)) score++
  if (/[0-9]/.test(password.value)) score++
  if (/[^A-Za-z0-9]/.test(password.value)) score++
  strengthLevel.value = score
}

const strengthPercent = computed(() => strengthLevel.value * 20)
const strengthClass = computed(() => {
  if (strengthLevel.value <= 1) return 'strength-weak'
  if (strengthLevel.value <= 3) return 'strength-medium'
  return 'strength-strong'
})
const strengthText = computed(() => {
  if (strengthLevel.value <= 1) return '弱'
  if (strengthLevel.value <= 3) return '中等'
  return '强'
})

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

.strength-bar {
  width: 100%;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-top: var(--space-2);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease, background 0.3s ease;
}

.strength-weak { background: var(--danger); }
.strength-medium { background: var(--warn); }
.strength-strong { background: var(--success); }

.strength-label {
  font-size: 0.75rem;
  margin-top: 2px;
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
}
.slide-leave-to {
  opacity: 0;
}
</style>

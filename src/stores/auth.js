import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  async function register(username, password) {
    loading.value = true
    try {
      const res = await client.post('/auth/register', { username, password })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '注册失败' }
    } finally {
      loading.value = false
    }
  }

  async function login(username, password) {
    loading.value = true
    try {
      const res = await client.post('/auth/login', { username, password })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await client.get('/auth/me')
      user.value = res.data.user
    } catch (err) {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, loading, isLoggedIn, register, login, fetchUser, logout }
})

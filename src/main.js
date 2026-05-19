import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import 'katex/dist/katex.min.css'
import './styles/main.css'

import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import HomePage from './pages/HomePage.vue'
import FormulaPage from './pages/FormulaPage.vue'
import PracticePage from './pages/PracticePage.vue'
import ErrorsPage from './pages/ErrorsPage.vue'
import MasteryPage from './pages/MasteryPage.vue'
import { useAuthStore } from './stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { guest: true } },
    { path: '/register', component: RegisterPage, meta: { guest: true } },
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    { path: '/formula', component: FormulaPage, meta: { requiresAuth: true } },
    { path: '/practice', component: PracticePage, meta: { requiresAuth: true } },
    { path: '/errors', component: ErrorsPage, meta: { requiresAuth: true } },
    { path: '/mastery', component: MasteryPage, meta: { requiresAuth: true } }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return '/login'
  }
  if (to.meta.guest && auth.isLoggedIn) {
    return '/'
  }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Try to restore user on app start
const auth = useAuthStore()
auth.fetchUser()

app.mount('#app')

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import 'katex/dist/katex.min.css'
import './styles/main.css'
import { useAuthStore } from './stores/auth.js'

// Lazy-loaded page components
const LoginPage = () => import('./pages/LoginPage.vue')
const RegisterPage = () => import('./pages/RegisterPage.vue')
const HomePage = () => import('./pages/HomePage.vue')
const FormulaPage = () => import('./pages/FormulaPage.vue')
const PracticePage = () => import('./pages/PracticePage.vue')
const ErrorsPage = () => import('./pages/ErrorsPage.vue')
const MasteryPage = () => import('./pages/MasteryPage.vue')
const WeakPointsPage = () => import('./pages/WeakPointsPage.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { guest: true } },
    { path: '/register', component: RegisterPage, meta: { guest: true } },
    { path: '/', component: HomePage, meta: { requiresAuth: true } },
    { path: '/formula', component: FormulaPage, meta: { requiresAuth: true } },
    { path: '/practice', component: PracticePage, meta: { requiresAuth: true } },
    { path: '/errors', component: ErrorsPage, meta: { requiresAuth: true } },
    { path: '/mastery', component: MasteryPage, meta: { requiresAuth: true } },
    { path: '/weak-points', component: WeakPointsPage, meta: { requiresAuth: true } }
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

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
}

// Try to restore user on app start
const auth = useAuthStore()
auth.fetchUser()

app.mount('#app')

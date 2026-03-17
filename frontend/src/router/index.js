import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
    meta: { publica: true }
  },
  {
    path: '/cadastro',
    component: () => import('@/views/CadastroView.vue'),
    meta: { publica: true }
  },
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requerAuth: true }
  },
  {
    path: '/agendamentos',
    component: () => import('@/views/AgendamentosView.vue'),
    meta: { requerAuth: true }
  },
  {
    path: '/agendar',
    component: () => import('@/views/NovoAgendamentoView.vue'),
    meta: { requerAuth: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requerAuth: true, requerAdmin: true }
  },
  {
    path: '/perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { requerAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requerAuth && !auth.autenticado) {
    return next('/login')
  }
  if (to.meta.publica && auth.autenticado) {
    return next('/dashboard')
  }
  if (to.meta.requerAdmin && !auth.podeGerenciar) {
    return next('/dashboard')
  }
  next()
})

export default router

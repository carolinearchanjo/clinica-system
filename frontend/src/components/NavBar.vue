<template>
  <nav class="navbar">
    <div class="nav-inner">
      <RouterLink to="/dashboard" class="nav-brand">
        <span class="brand-icon">🏥</span>
        <span class="brand-name">ClinicaFácil</span>
      </RouterLink>

      <div class="nav-links">
        <RouterLink to="/dashboard" class="nav-link">Início</RouterLink>
        <RouterLink to="/agendamentos" class="nav-link">Meus Agendamentos</RouterLink>
        <RouterLink to="/agendar" class="nav-link nav-link-cta">+ Agendar</RouterLink>
        <RouterLink v-if="auth.podeGerenciar" to="/admin" class="nav-link">Painel Admin</RouterLink>
      </div>

      <div class="nav-user">
        <RouterLink to="/perfil" class="user-chip">
          <span class="user-avatar">{{ iniciais }}</span>
          <span class="user-name">{{ auth.usuario?.nome?.split(' ')[0] }}</span>
        </RouterLink>
        <button class="btn btn-sm btn-secondary" @click="sair">Sair</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()

const iniciais = computed(() => {
  const nome = auth.usuario?.nome || ''
  return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
})

const sair = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: var(--branco);
  border-bottom: 1px solid var(--borda);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}
.nav-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}
.brand-icon { font-size: 20px; }
.brand-name {
  font-family: var(--fonte-display);
  font-size: 18px;
  color: var(--verde);
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--texto-suave);
  text-decoration: none;
  transition: all 0.15s;
}
.nav-link:hover, .nav-link.router-link-active {
  background: var(--verde-pale);
  color: var(--verde);
  text-decoration: none;
}
.nav-link-cta {
  background: var(--verde);
  color: #fff !important;
  font-weight: 500;
}
.nav-link-cta:hover { background: var(--verde-claro) !important; }
.nav-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  border: 1px solid var(--borda);
  transition: all 0.15s;
}
.user-chip:hover { background: var(--verde-pale); border-color: var(--verde-menta); }
.user-avatar {
  width: 28px;
  height: 28px;
  background: var(--verde);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}
.user-name { font-size: 13px; font-weight: 500; color: var(--texto); }
</style>

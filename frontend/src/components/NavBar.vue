<template>
  <nav class="navbar">
    <div class="nav-inner">
      <RouterLink to="/dashboard" class="nav-brand">
        <span class="brand-icon">🏥</span>
        <span class="brand-name">ClinicaFácil</span>
      </RouterLink>

      <!-- Desktop -->
      <div class="nav-links desktop-only">
        <RouterLink to="/dashboard" class="nav-link">Início</RouterLink>
        <RouterLink to="/agendamentos" class="nav-link">
          {{ auth.podeGerenciar ? 'Agendamentos' : 'Meus Agendamentos' }}
        </RouterLink>
        <RouterLink to="/agendar" class="nav-link nav-link-cta">+ Agendar</RouterLink>
        <RouterLink v-if="auth.podeGerenciar" to="/admin" class="nav-link">Painel Admin</RouterLink>
      </div>

      <div class="nav-user desktop-only">
        <RouterLink to="/perfil" class="user-chip">
          <span class="user-avatar">{{ iniciais }}</span>
          <span class="user-name">{{ auth.usuario?.nome?.split(' ')[0] }}</span>
        </RouterLink>
        <button class="btn btn-sm btn-secondary" @click="sair">Sair</button>
      </div>

      <!-- Botão hamburguer mobile -->
      <button class="hamburger mobile-only" @click="menuAberto = !menuAberto" :class="{ ativo: menuAberto }">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <!-- Menu mobile -->
    <div class="mobile-menu" :class="{ aberto: menuAberto }" @click="menuAberto = false">
      <div class="mobile-menu-inner">
        <div class="mobile-user">
          <span class="user-avatar">{{ iniciais }}</span>
          <div>
            <div style="font-weight:500">{{ auth.usuario?.nome }}</div>
            <div class="text-sm text-muted">{{ auth.usuario?.email }}</div>
          </div>
        </div>
        <div class="mobile-links">
          <RouterLink to="/dashboard" class="mobile-link">🏠 Início</RouterLink>
          <RouterLink to="/agendamentos" class="mobile-link">
            📋 {{ auth.podeGerenciar ? 'Agendamentos' : 'Meus Agendamentos' }}
          </RouterLink>
          <RouterLink to="/agendar" class="mobile-link mobile-link-cta">+ Agendar Consulta</RouterLink>
          <RouterLink v-if="auth.podeGerenciar" to="/admin" class="mobile-link">⚙️ Painel Admin</RouterLink>
          <RouterLink to="/perfil" class="mobile-link">👤 Meu Perfil</RouterLink>
        </div>
        <button class="btn btn-secondary btn-block" @click="sair">Sair</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()
const menuAberto = ref(false)

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
  display: flex; align-items: center; gap: 8px;
  text-decoration: none; flex-shrink: 0;
}
.brand-icon { font-size: 20px; }
.brand-name { font-family: var(--fonte-display); font-size: 18px; color: var(--verde); }

.nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
.nav-link {
  padding: 6px 12px; border-radius: var(--radius-sm); font-size: 14px;
  color: var(--texto-suave); text-decoration: none; transition: all 0.15s; white-space: nowrap;
}
.nav-link:hover, .nav-link.router-link-active {
  background: var(--verde-pale); color: var(--verde); text-decoration: none;
}
.nav-link-cta { background: var(--verde); color: #fff !important; font-weight: 500; }
.nav-link-cta:hover { background: var(--verde-claro) !important; }

.nav-user { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }
.user-chip {
  display: flex; align-items: center; gap: 8px; text-decoration: none;
  padding: 4px 10px 4px 4px; border-radius: 20px; border: 1px solid var(--borda); transition: all 0.15s;
}
.user-chip:hover { background: var(--verde-pale); border-color: var(--verde-menta); }
.user-avatar {
  width: 28px; height: 28px; background: var(--verde); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; flex-shrink: 0;
}
.user-name { font-size: 13px; font-weight: 500; color: var(--texto); }

/* Hamburguer */
.hamburger {
  display: none; flex-direction: column; justify-content: center;
  gap: 5px; background: none; border: none; cursor: pointer;
  padding: 8px; margin-left: auto; border-radius: var(--radius-sm);
}
.hamburger span {
  display: block; width: 22px; height: 2px;
  background: var(--texto); border-radius: 2px; transition: all 0.2s;
}
.hamburger.ativo span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.ativo span:nth-child(2) { opacity: 0; }
.hamburger.ativo span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Menu mobile */
.mobile-menu {
  display: none;
  position: fixed;
  inset: 60px 0 0 0;
  background: rgba(0,0,0,0.4);
  z-index: 99;
}
.mobile-menu.aberto { display: block; }
.mobile-menu-inner {
  background: var(--branco);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-bottom: 1px solid var(--borda);
  box-shadow: var(--sombra-hover);
}
.mobile-user {
  display: flex; align-items: center; gap: 12px;
  padding-bottom: 16px; border-bottom: 1px solid var(--borda);
}
.mobile-user .user-avatar { width: 40px; height: 40px; font-size: 15px; }
.mobile-links { display: flex; flex-direction: column; gap: 4px; }
.mobile-link {
  display: block; padding: 12px 14px; border-radius: var(--radius-sm);
  text-decoration: none; color: var(--texto); font-size: 15px; transition: all 0.15s;
}
.mobile-link:hover, .mobile-link.router-link-active {
  background: var(--verde-pale); color: var(--verde); text-decoration: none;
}
.mobile-link-cta {
  background: var(--verde); color: #fff !important;
  font-weight: 500; text-align: center; margin-top: 4px;
}
.mobile-link-cta:hover { background: var(--verde-claro) !important; }

/* Responsivo */
.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: flex !important; }
  .nav-inner { gap: 0; }
}
</style>
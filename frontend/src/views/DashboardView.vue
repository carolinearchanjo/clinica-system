<template>
  <div>
    <div class="dash-header">
      <div>
        <h1>Olá, {{ primeiroNome }} 👋</h1>
        <p class="text-muted">{{ dataHoje }}</p>
      </div>
      <RouterLink to="/agendar" class="btn btn-primary">+ Nova Consulta</RouterLink>
    </div>

    <!-- Cards de resumo (admin/secretário) -->
    <div v-if="auth.podeGerenciar && resumo" class="stats-grid mt-3">
      <div class="stat-card card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-valor">{{ resumo.agendamentosHoje }}</div>
          <div class="stat-label">Consultas hoje</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <div class="stat-valor">{{ resumo.agendamentosPendentes }}</div>
          <div class="stat-label">Pendentes</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-valor">{{ resumo.totalPacientes }}</div>
          <div class="stat-label">Pacientes cadastrados</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <div class="stat-valor">{{ resumo.totalAgendamentos }}</div>
          <div class="stat-label">Total de consultas</div>
        </div>
      </div>
    </div>

    <!-- Próximos agendamentos do paciente -->
    <div class="mt-4">
      <h2 class="section-title">Próximas Consultas</h2>
      <div v-if="carregando" class="empty-state">
        <span class="spinner spinner-dark"></span>
      </div>
      <div v-else-if="proximosAgendamentos.length === 0" class="empty-state card mt-2">
        <div class="icon">🗓️</div>
        <p>Nenhuma consulta agendada</p>
        <RouterLink to="/agendar" class="btn btn-primary btn-sm mt-2">Agendar agora</RouterLink>
      </div>
      <div v-else class="agendamentos-lista mt-2">
        <div v-for="ag in proximosAgendamentos" :key="ag._id" class="ag-card card">
          <div class="ag-data">
            <div class="ag-dia">{{ formatarDia(ag.data) }}</div>
            <div class="ag-mes">{{ formatarMes(ag.data) }}</div>
          </div>
          <div class="ag-info">
            <div class="ag-titulo">{{ ag.especialidade }}</div>
            <div class="text-sm text-muted">Dr(a). {{ ag.medico }}</div>
            <div class="text-sm text-muted">🕐 {{ ag.horario }}</div>
          </div>
          <div class="ag-right">
            <span class="badge" :class="`badge-${ag.status}`">{{ ag.status }}</span>
            <div v-if="ag.previsaoClimatica?.chuva" class="alerta-chuva-mini">🌧️ Chuva prevista</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()
const carregando = ref(true)
const agendamentos = ref([])
const resumo = ref(null)

const primeiroNome = computed(() => auth.usuario?.nome?.split(' ')[0] || '')
const dataHoje = computed(() => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))

const proximosAgendamentos = computed(() => {
  const hoje = new Date(); hoje.setHours(0,0,0,0)
  return agendamentos.value
    .filter(a => new Date(a.data) >= hoje && a.status !== 'cancelado')
    .slice(0, 5)
})

const formatarDia = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })
const formatarMes = (data) => new Date(data).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')

onMounted(async () => {
  try {
    const { data } = await api.get('/agendamentos/meus')
    agendamentos.value = data.agendamentos || []

    if (auth.podeGerenciar) {
      const res = await api.get('/admin/dashboard')
      resumo.value = res.data.dashboard
    }
  } catch {} finally {
    carregando.value = false
  }
})
</script>

<style scoped>
.dash-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.dash-header h1 { font-size: 28px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card { display: flex; align-items: center; gap: 14px; }
.stat-icon { font-size: 28px; }
.stat-valor { font-size: 26px; font-family: var(--fonte-display); color: var(--verde); }
.stat-label { font-size: 12px; color: var(--texto-suave); }
.section-title { font-size: 18px; font-family: var(--fonte-display); }
.agendamentos-lista { display: flex; flex-direction: column; gap: 12px; }
.ag-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; }
.ag-data { text-align: center; min-width: 48px; }
.ag-dia { font-size: 24px; font-family: var(--fonte-display); color: var(--verde); line-height: 1; }
.ag-mes { font-size: 12px; text-transform: uppercase; color: var(--texto-suave); }
.ag-info { flex: 1; }
.ag-titulo { font-weight: 500; }
.ag-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.alerta-chuva-mini { font-size: 11px; color: var(--aviso); background: var(--aviso-pale); padding: 2px 8px; border-radius: 10px; }
</style>

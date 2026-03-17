<template>
  <div>
    <div class="page-header">
      <h1>Meus Agendamentos</h1>
      <RouterLink to="/agendar" class="btn btn-primary btn-sm">+ Nova Consulta</RouterLink>
    </div>

    <!-- Filtros -->
    <div class="filtros card mt-3">
      <div class="filtros-inner">
        <label class="form-label">Status</label>
        <div class="filtro-btns">
          <button v-for="s in statusOpcoes" :key="s.value"
            class="btn btn-sm" :class="filtroStatus === s.value ? 'btn-primary' : 'btn-secondary'"
            @click="filtroStatus = s.value">{{ s.label }}</button>
        </div>
      </div>
    </div>

    <div v-if="carregando" class="empty-state mt-4">
      <span class="spinner spinner-dark"></span>
    </div>

    <div v-else-if="agendamentosFiltrados.length === 0" class="empty-state card mt-3">
      <div class="icon">📋</div>
      <p>Nenhum agendamento encontrado</p>
    </div>

    <div v-else class="lista mt-3">
      <div v-for="ag in agendamentosFiltrados" :key="ag._id" class="ag-item card">
        <div class="ag-data-bloco">
          <div class="ag-dia">{{ formatarDia(ag.data) }}</div>
          <div class="ag-mes">{{ formatarMes(ag.data) }}</div>
          <div class="ag-ano text-sm text-muted">{{ formatarAno(ag.data) }}</div>
        </div>
        <div class="ag-corpo">
          <div class="ag-top">
            <div>
              <div class="ag-especialidade">{{ ag.especialidade }}</div>
              <div class="text-sm text-muted">Dr(a). {{ ag.medico }}</div>
            </div>
            <span class="badge" :class="`badge-${ag.status}`">{{ ag.status }}</span>
          </div>
          <div class="ag-detalhes text-sm text-muted mt-1">
            <span>🕐 {{ ag.horario }}</span>
            <span v-if="ag.enderecoConsulta?.cidade">📍 {{ ag.enderecoConsulta.cidade }}</span>
            <span v-if="ag.previsaoClimatica?.chuva" class="clima-badge">🌧️ Chuva prevista</span>
          </div>
          <div v-if="ag.observacoes" class="ag-obs text-sm mt-1">{{ ag.observacoes }}</div>
        </div>
        <div v-if="ag.status === 'agendado'" class="ag-acoes">
          <button class="btn btn-danger btn-sm" @click="cancelar(ag._id)" :disabled="cancelando === ag._id">
            <span v-if="cancelando === ag._id" class="spinner"></span>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const carregando = ref(true)
const cancelando = ref(null)
const agendamentos = ref([])
const filtroStatus = ref('todos')

const statusOpcoes = [
  { value: 'todos', label: 'Todos' },
  { value: 'agendado', label: 'Agendados' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'realizado', label: 'Realizados' },
  { value: 'cancelado', label: 'Cancelados' }
]

const agendamentosFiltrados = computed(() => {
  if (filtroStatus.value === 'todos') return agendamentos.value
  return agendamentos.value.filter(a => a.status === filtroStatus.value)
})

const formatarDia = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })
const formatarMes = (d) => new Date(d).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
const formatarAno = (d) => new Date(d).getFullYear()

const cancelar = async (id) => {
  if (!confirm('Confirma o cancelamento desta consulta?')) return
  cancelando.value = id
  try {
    await api.patch(`/agendamentos/${id}/cancelar`)
    const ag = agendamentos.value.find(a => a._id === id)
    if (ag) ag.status = 'cancelado'
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao cancelar')
  } finally {
    cancelando.value = null
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/agendamentos/meus')
    agendamentos.value = (data.agendamentos || []).sort((a, b) => new Date(b.data) - new Date(a.data))
  } finally {
    carregando.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h1 { font-size: 26px; }
.filtros { padding: 14px 20px; }
.filtros-inner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filtro-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.lista { display: flex; flex-direction: column; gap: 12px; }
.ag-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 20px; }
.ag-data-bloco { text-align: center; min-width: 48px; flex-shrink: 0; }
.ag-dia { font-size: 22px; font-family: var(--fonte-display); color: var(--verde); line-height: 1; }
.ag-mes { font-size: 12px; text-transform: uppercase; color: var(--texto-suave); }
.ag-corpo { flex: 1; }
.ag-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.ag-especialidade { font-weight: 500; }
.ag-detalhes { display: flex; gap: 12px; flex-wrap: wrap; }
.ag-obs { color: var(--texto-suave); font-style: italic; }
.ag-acoes { display: flex; align-items: flex-start; }
.clima-badge { color: var(--aviso); background: var(--aviso-pale); padding: 1px 8px; border-radius: 10px; font-size: 11px; }
</style>

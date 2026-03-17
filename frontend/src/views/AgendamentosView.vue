<template>
  <div>
    <div class="page-header">
      <h1>{{ auth.podeGerenciar ? 'Agendamentos' : 'Meus Agendamentos' }}</h1>
      <RouterLink to="/agendar" class="btn btn-primary btn-sm">+ Nova Consulta</RouterLink>
    </div>

    <!-- Filtros admin/secretário -->
    <div v-if="auth.podeGerenciar" class="filtros card mt-3">
      <div class="filtros-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="filtroAdm.status" class="form-input" @change="buscarTodos">
            <option value="">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="confirmado">Confirmado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Data</label>
          <input v-model="filtroAdm.data" type="date" class="form-input" @change="buscarTodos" />
        </div>
        <div class="form-group">
          <label class="form-label">Médico</label>
          <input v-model="filtroAdm.medico" type="text" class="form-input" placeholder="Nome do médico" @keyup.enter="buscarTodos" />
        </div>
        <button class="btn btn-primary btn-sm" style="align-self:flex-end" @click="buscarTodos">Filtrar</button>
      </div>
    </div>

    <!-- Filtros paciente -->
    <div v-else class="filtros card mt-3">
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

    <div v-else-if="agendamentosExibidos.length === 0" class="empty-state card mt-3">
      <div class="icon">📋</div>
      <p>Nenhum agendamento encontrado</p>
    </div>

    <!-- Lista paciente -->
    <div v-else-if="!auth.podeGerenciar" class="lista mt-3">
      <div v-for="ag in agendamentosExibidos" :key="ag._id" class="ag-item card">
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
        <div class="ag-acoes">
          <button
            v-if="ag.status === 'agendado' || ag.status === 'confirmado'"
            class="btn btn-danger btn-sm"
            @click="cancelarPaciente(ag._id)"
            :disabled="cancelando === ag._id">
            <span v-if="cancelando === ag._id" class="spinner"></span>
            Cancelar
          </button>
          <span v-else-if="statusFinal(ag.status)" class="status-final text-sm text-muted">
            {{ ag.status === 'realizado' ? '✅ Realizado' : '❌ Cancelado' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabela admin/secretário -->
    <div v-else class="card mt-3 table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Especialidade / Médico</th>
            <th>Data / Hora</th>
            <th>Clima</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ag in agendamentosExibidos" :key="ag._id">
            <td>
              <div>{{ ag.paciente?.nome }}</div>
              <div class="text-sm text-muted">{{ ag.paciente?.telefone || ag.paciente?.email }}</div>
            </td>
            <td>
              <div>{{ ag.especialidade }}</div>
              <div class="text-sm text-muted">{{ ag.medico }}</div>
            </td>
            <td>
              <div>{{ formatarData(ag.data) }}</div>
              <div class="text-sm text-muted">{{ ag.horario }}</div>
            </td>
            <td>
              <span v-if="ag.previsaoClimatica?.chuva">🌧️</span>
              <span v-else-if="ag.previsaoClimatica">☀️</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <!-- Status final: só exibe badge, sem select -->
              <span v-if="statusFinal(ag.status)" class="badge" :class="`badge-${ag.status}`">
                {{ ag.status }}
              </span>
              <select v-else class="form-input" style="width:130px;padding:6px 10px;font-size:13px"
                :value="ag.status" @change="atualizarStatus(ag._id, $event.target.value)">
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </td>
            <td>
              <button
                v-if="!statusFinal(ag.status)"
                class="btn btn-danger btn-sm"
                @click="atualizarStatus(ag._id, 'cancelado')"
                :disabled="cancelando === ag._id">
                Cancelar
              </button>
              <span v-else class="text-sm text-muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="paginacao mt-2">
        <button class="btn btn-sm btn-secondary" :disabled="pagina <= 1" @click="mudarPagina(pagina - 1)">← Anterior</button>
        <span class="text-sm text-muted">Pág. {{ pagina }} de {{ totalPaginas }}</span>
        <button class="btn btn-sm btn-secondary" :disabled="pagina >= totalPaginas" @click="mudarPagina(pagina + 1)">Próxima →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()
const carregando = ref(true)
const cancelando = ref(null)
const agendamentos = ref([])
const pagina = ref(1)
const totalPaginas = ref(1)

const filtroStatus = ref('todos')
const statusOpcoes = [
  { value: 'todos', label: 'Todos' },
  { value: 'agendado', label: 'Agendados' },
  { value: 'confirmado', label: 'Confirmados' },
  { value: 'realizado', label: 'Realizados' },
  { value: 'cancelado', label: 'Cancelados' }
]

const filtroAdm = reactive({ status: '', data: '', medico: '' })

const statusFinal = (s) => s === 'cancelado' || s === 'realizado'

const agendamentosExibidos = computed(() => {
  if (auth.podeGerenciar) return agendamentos.value
  if (filtroStatus.value === 'todos') return agendamentos.value
  return agendamentos.value.filter(a => a.status === filtroStatus.value)
})

const formatarDia = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' })
const formatarMes = (d) => new Date(d).toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '')
const formatarAno = (d) => new Date(d).getFullYear()
const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

const cancelarPaciente = async (id) => {
  if (!confirm('Confirma o cancelamento desta consulta?')) return
  cancelando.value = id
  try {
    await api.patch(`/agendamentos/${id}/cancelar`)
    const ag = agendamentos.value.find(a => a._id === id)
    if (ag) ag.status = 'cancelado'
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao cancelar')
  } finally { cancelando.value = null }
}

const atualizarStatus = async (id, status) => {
  cancelando.value = id
  try {
    await api.patch(`/admin/agendamentos/${id}/status`, { status })
    const ag = agendamentos.value.find(a => a._id === id)
    if (ag) ag.status = status
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao atualizar')
  } finally { cancelando.value = null }
}

const buscarTodos = async () => {
  carregando.value = true
  try {
    const params = { page: pagina.value, limit: 15 }
    if (filtroAdm.status) params.status = filtroAdm.status
    if (filtroAdm.data) params.data = filtroAdm.data
    if (filtroAdm.medico) params.medico = filtroAdm.medico
    const { data } = await api.get('/admin/agendamentos', { params })
    agendamentos.value = data.agendamentos || []
    totalPaginas.value = data.paginas || 1
  } finally { carregando.value = false }
}

const mudarPagina = (p) => { pagina.value = p; buscarTodos() }

onMounted(async () => {
  if (auth.podeGerenciar) {
    await buscarTodos()
  } else {
    try {
      const { data } = await api.get('/agendamentos/meus')
      agendamentos.value = (data.agendamentos || []).sort((a, b) => new Date(b.data) - new Date(a.data))
    } finally { carregando.value = false }
  }
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h1 { font-size: 26px; }
.filtros { padding: 14px 20px; }
.filtros-inner { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filtros-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.filtros-row .form-group { min-width: 140px; }
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
.ag-acoes { display: flex; align-items: flex-start; flex-shrink: 0; }
.clima-badge { color: var(--aviso); background: var(--aviso-pale); padding: 1px 8px; border-radius: 10px; font-size: 11px; }
.status-final { font-size: 12px; }
.paginacao { display: flex; align-items: center; gap: 12px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid var(--borda); }
</style>
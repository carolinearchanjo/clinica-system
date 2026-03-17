<template>
  <div>
    <h1 class="page-title-h1">Painel Administrativo</h1>

    <!-- Tabs -->
    <div class="tabs mt-3">
      <button v-for="t in tabs" :key="t.id"
        class="tab-btn" :class="{ ativo: tabAtiva === t.id }"
        @click="tabAtiva = t.id">{{ t.label }}</button>
    </div>

    <!-- Agendamentos -->
    <div v-if="tabAtiva === 'agendamentos'" class="mt-3">
      <div class="filtros card">
        <div class="filtros-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select v-model="filtros.status" class="form-input" @change="buscarAgendamentos">
              <option value="">Todos</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="realizado">Realizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data</label>
            <input v-model="filtros.data" type="date" class="form-input" @change="buscarAgendamentos" />
          </div>
          <div class="form-group">
            <label class="form-label">Médico</label>
            <input v-model="filtros.medico" type="text" class="form-input" placeholder="Nome do médico"
              @keyup.enter="buscarAgendamentos" />
          </div>
          <button class="btn btn-primary btn-sm" style="align-self:flex-end" @click="buscarAgendamentos">Filtrar</button>
        </div>
      </div>

      <div v-if="carregandoAg" class="empty-state mt-3"><span class="spinner spinner-dark"></span></div>
      <div v-else-if="agendamentos.length === 0" class="empty-state card mt-3">
        <div class="icon">📋</div>
        <p>Nenhum agendamento encontrado</p>
      </div>
      <div v-else class="card mt-3 table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Especialidade / Médico</th>
              <th>Data / Hora</th>
              <th>Status</th>
              <th>Clima</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ag in agendamentos" :key="ag._id">
              <td>
                <div>{{ ag.paciente?.nome }}</div>
                <div class="text-sm text-muted">{{ ag.paciente?.telefone }}</div>
              </td>
              <td>
                <div>{{ ag.especialidade }}</div>
                <div class="text-sm text-muted">{{ ag.medico }}</div>
              </td>
              <td>
                <div>{{ formatarData(ag.data) }}</div>
                <div class="text-sm text-muted">{{ ag.horario }}</div>
              </td>
              <td><span class="badge" :class="`badge-${ag.status}`">{{ ag.status }}</span></td>
              <td>
                <span v-if="ag.previsaoClimatica?.chuva" title="Chuva prevista">🌧️</span>
                <span v-else-if="ag.previsaoClimatica">☀️</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <select class="form-input" style="width:130px;padding:6px 10px;font-size:13px"
                  :value="ag.status" @change="atualizarStatus(ag._id, $event.target.value)">
                  <option value="agendado">Agendado</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="realizado">Realizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
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

    <!-- Usuários -->
    <div v-if="tabAtiva === 'usuarios' && auth.isAdmin" class="mt-3">
      <div v-if="carregandoUs" class="empty-state"><span class="spinner spinner-dark"></span></div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>CPF</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u._id">
              <td>{{ u.nome }}</td>
              <td class="text-sm">{{ u.email }}</td>
              <td class="text-sm text-muted">{{ u.cpf || '—' }}</td>
              <td>
                <select class="form-input" style="width:120px;padding:6px 10px;font-size:13px"
                  :value="u.perfil" @change="alterarPerfil(u._id, $event.target.value, u.ativo)">
                  <option value="paciente">Paciente</option>
                  <option value="secretario">Secretário</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <span class="badge" :class="u.ativo ? 'badge-confirmado' : 'badge-cancelado'">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="text-sm text-muted">{{ formatarData(u.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()

const tabs = [
  { id: 'agendamentos', label: '📅 Agendamentos' },
  ...(auth.isAdmin ? [{ id: 'usuarios', label: '👥 Usuários' }] : [])
]
const tabAtiva = ref('agendamentos')
const agendamentos = ref([])
const usuarios = ref([])
const carregandoAg = ref(false)
const carregandoUs = ref(false)
const pagina = ref(1)
const totalPaginas = ref(1)
const filtros = reactive({ status: '', data: '', medico: '' })

import { reactive, watch } from 'vue'

const buscarAgendamentos = async () => {
  carregandoAg.value = true
  try {
    const params = { page: pagina.value, limit: 15 }
    if (filtros.status) params.status = filtros.status
    if (filtros.data) params.data = filtros.data
    if (filtros.medico) params.medico = filtros.medico
    const { data } = await api.get('/admin/agendamentos', { params })
    agendamentos.value = data.agendamentos || []
    totalPaginas.value = data.paginas || 1
  } finally {
    carregandoAg.value = false
  }
}

const buscarUsuarios = async () => {
  carregandoUs.value = true
  try {
    const { data } = await api.get('/admin/usuarios')
    usuarios.value = data.usuarios || []
  } finally {
    carregandoUs.value = false
  }
}

const mudarPagina = (p) => { pagina.value = p; buscarAgendamentos() }

const atualizarStatus = async (id, status) => {
  try {
    await api.patch(`/admin/agendamentos/${id}/status`, { status })
    const ag = agendamentos.value.find(a => a._id === id)
    if (ag) ag.status = status
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao atualizar')
  }
}

const alterarPerfil = async (id, perfil, ativo) => {
  try {
    await api.patch(`/admin/usuarios/${id}`, { perfil, ativo })
  } catch (err) {
    alert(err.response?.data?.message || 'Erro ao atualizar')
  }
}

const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

watch(tabAtiva, (t) => {
  if (t === 'usuarios' && usuarios.value.length === 0) buscarUsuarios()
})

onMounted(() => {
  buscarAgendamentos()
})
</script>

<style scoped>
.page-title-h1 { font-size: 26px; }
.tabs { display: flex; gap: 4px; border-bottom: 2px solid var(--borda); }
.tab-btn {
  padding: 10px 18px; border: none; background: none; cursor: pointer;
  font-family: var(--fonte-body); font-size: 14px; color: var(--texto-suave);
  border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s;
}
.tab-btn.ativo { color: var(--verde); border-bottom-color: var(--verde); font-weight: 500; }
.tab-btn:hover { color: var(--verde); background: var(--verde-pale); border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
.filtros { padding: 16px 20px; }
.filtros-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.filtros-row .form-group { min-width: 150px; }
.paginacao { display: flex; align-items: center; gap: 12px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid var(--borda); }
</style>

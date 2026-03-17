<template>
  <div>
    <h1 class="page-title-h1">Painel Administrativo</h1>

    <div class="tabs mt-3">
      <button v-for="t in tabs" :key="t.id"
        class="tab-btn" :class="{ ativo: tabAtiva === t.id }"
        @click="mudarTab(t.id)">{{ t.label }}</button>
    </div>

    <!-- ===== PACIENTES ===== -->
    <div v-if="tabAtiva === 'pacientes'" class="mt-3">
      <div class="section-header mb-2">
        <div class="filtros card" style="flex:1">
          <div class="filtros-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Buscar</label>
              <input v-model="buscaPaciente" type="text" class="form-input"
                placeholder="Nome, e-mail ou CPF..." @keyup.enter="buscarPacientes" />
            </div>
            <button class="btn btn-primary btn-sm" style="align-self:flex-end" @click="buscarPacientes">Buscar</button>
          </div>
        </div>
        <button class="btn btn-primary" @click="abrirCadastroPaciente">+ Novo Paciente</button>
      </div>

      <div v-if="carregandoPac" class="empty-state mt-3"><span class="spinner spinner-dark"></span></div>
      <div v-else-if="pacientesList.length === 0" class="empty-state card mt-3">
        <div class="icon">👥</div><p>Nenhum paciente encontrado</p>
      </div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>E-mail</th><th>Telefone</th><th>CPF</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pacientesList" :key="p._id">
              <td>{{ p.nome }}</td>
              <td class="text-sm">{{ p.email }}</td>
              <td class="text-sm text-muted">{{ p.telefone || '—' }}</td>
              <td class="text-sm text-muted">{{ p.cpf || '—' }}</td>
              <td>
                <span class="badge" :class="p.ativo ? 'badge-confirmado' : 'badge-cancelado'">
                  {{ p.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-secondary" @click="abrirEdicaoPaciente(p)">✏️ Editar</button>
                  <button class="btn btn-sm btn-danger" @click="confirmarExclusao(p)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== USUÁRIOS (admin only) ===== -->
    <div v-if="tabAtiva === 'usuarios' && auth.isAdmin" class="mt-3">
      <div class="section-header mb-2">
        <div class="filtros card" style="flex:1">
          <div class="filtros-row">
            <div class="form-group" style="flex:1">
              <label class="form-label">Buscar</label>
              <input v-model="buscaUsuario" type="text" class="form-input"
                placeholder="Nome ou e-mail..." @keyup.enter="buscarUsuarios" />
            </div>
            <div class="form-group">
              <label class="form-label">Perfil</label>
              <select v-model="filtroPerfilUsuario" class="form-input" @change="buscarUsuarios">
                <option value="">Todos</option>
                <option value="secretario">Secretário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" style="align-self:flex-end" @click="buscarUsuarios">Buscar</button>
          </div>
        </div>
        <button class="btn btn-primary" @click="abrirCadastroUsuario">+ Novo Usuário</button>
      </div>

      <div v-if="carregandoUs" class="empty-state mt-3"><span class="spinner spinner-dark"></span></div>
      <div v-else-if="usuarios.length === 0" class="empty-state card mt-3">
        <div class="icon">👤</div><p>Nenhum usuário encontrado</p>
      </div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u._id">
              <td>{{ u.nome }}</td>
              <td class="text-sm">{{ u.email }}</td>
              <td><span class="badge badge-agendado">{{ u.perfil }}</span></td>
              <td>
                <span class="badge" :class="u.ativo ? 'badge-confirmado' : 'badge-cancelado'">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="text-sm text-muted">{{ formatarData(u.createdAt) }}</td>
              <td>
                <button class="btn btn-sm btn-secondary" @click="abrirEdicaoUsuario(u)">✏️ Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== MODAL PACIENTE ===== -->
    <div v-if="modalPaciente" class="modal-overlay" @click.self="modalPaciente = false">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editandoPaciente ? 'Editar Paciente' : 'Novo Paciente' }}</h3>
          <button class="modal-close" @click="modalPaciente = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="formPaciente.nome" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail *</label>
              <input v-model="formPaciente.email" type="text" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input v-model="formPaciente.telefone" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">CPF</label>
              <input v-model="formPaciente.cpf" type="text" class="form-input" />
            </div>
          </div>
          <div class="form-row" v-if="!editandoPaciente">
            <div class="form-group">
              <label class="form-label">Senha *</label>
              <input v-model="formPaciente.senha" type="password" class="form-input" autocomplete="new-password" />
            </div>
          </div>
          <div class="form-group" v-if="editandoPaciente">
            <label class="form-label">Status</label>
            <select v-model="formPaciente.ativo" class="form-input">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>
          <div v-if="erroModal" class="alert alert-erro mt-2">⚠️ {{ erroModal }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalPaciente = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="salvando" @click="salvarPaciente">
            <span v-if="salvando" class="spinner"></span>
            {{ salvando ? 'Salvando...' : editandoPaciente ? 'Salvar' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL USUÁRIO ===== -->
    <div v-if="modalUsuario" class="modal-overlay" @click.self="modalUsuario = false">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editandoUsuario ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
          <button class="modal-close" @click="modalUsuario = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input v-model="formUsuario.nome" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail *</label>
              <input v-model="formUsuario.email" type="text" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ editandoUsuario ? 'Nova senha (deixe em branco para manter)' : 'Senha *' }}</label>
              <input v-model="formUsuario.senha" type="password" class="form-input" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label class="form-label">Perfil *</label>
              <select v-model="formUsuario.perfil" class="form-input">
                <option value="secretario">Secretário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Telefone</label>
              <input v-model="formUsuario.telefone" type="text" class="form-input" />
            </div>
            <div class="form-group" v-if="editandoUsuario">
              <label class="form-label">Status</label>
              <select v-model="formUsuario.ativo" class="form-input">
                <option :value="true">Ativo</option>
                <option :value="false">Inativo</option>
              </select>
            </div>
          </div>
          <div v-if="erroModal" class="alert alert-erro mt-2">⚠️ {{ erroModal }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalUsuario = false">Cancelar</button>
          <button class="btn btn-primary" :disabled="salvando" @click="salvarUsuario">
            <span v-if="salvando" class="spinner"></span>
            {{ salvando ? 'Salvando...' : editandoUsuario ? 'Salvar' : 'Cadastrar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL CONFIRMAR EXCLUSÃO ===== -->
    <div v-if="modalExclusao" class="modal-overlay" @click.self="modalExclusao = false">
      <div class="modal card" style="max-width:420px">
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button class="modal-close" @click="modalExclusao = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Tem certeza que deseja excluir o paciente <strong>{{ pacienteParaExcluir?.nome }}</strong>?</p>
          <p class="text-sm text-muted mt-1">Esta ação cancelará todos os agendamentos futuros e não pode ser desfeita.</p>
          <div v-if="erroModal" class="alert alert-erro mt-2">⚠️ {{ erroModal }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalExclusao = false">Cancelar</button>
          <button class="btn btn-danger" :disabled="salvando" @click="excluirPaciente">
            <span v-if="salvando" class="spinner"></span>
            {{ salvando ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()

const tabs = [
  { id: 'pacientes', label: '🧑‍⚕️ Pacientes' },
  ...(auth.isAdmin ? [{ id: 'usuarios', label: '🔑 Usuários' }] : [])
]

const tabAtiva = ref('pacientes')

// Pacientes
const pacientesList = ref([])
const carregandoPac = ref(false)
const buscaPaciente = ref('')

// Usuários
const usuarios = ref([])
const carregandoUs = ref(false)
const buscaUsuario = ref('')
const filtroPerfilUsuario = ref('')

// Estado modais
const modalPaciente = ref(false)
const modalUsuario = ref(false)
const modalExclusao = ref(false)
const editandoPaciente = ref(false)
const editandoUsuario = ref(false)
const salvando = ref(false)
const erroModal = ref('')
const idEditando = ref(null)
const pacienteParaExcluir = ref(null)

const formPaciente = reactive({ nome: '', email: '', senha: '', telefone: '', cpf: '', ativo: true })
const formUsuario = reactive({ nome: '', email: '', senha: '', perfil: 'secretario', telefone: '', ativo: true })

const mudarTab = (id) => {
  tabAtiva.value = id
  if (id === 'pacientes' && pacientesList.value.length === 0) buscarPacientes()
  if (id === 'usuarios' && usuarios.value.length === 0) buscarUsuarios()
}

// ---- Pacientes ----
const buscarPacientes = async () => {
  carregandoPac.value = true
  try {
    const params = { perfil: 'paciente' }
    if (buscaPaciente.value) params.busca = buscaPaciente.value
    const { data } = await api.get('/admin/usuarios', { params })
    pacientesList.value = data.usuarios || []
  } finally { carregandoPac.value = false }
}

const abrirCadastroPaciente = () => {
  editandoPaciente.value = false
  idEditando.value = null
  Object.assign(formPaciente, { nome: '', email: '', senha: '', telefone: '', cpf: '', ativo: true })
  erroModal.value = ''
  modalPaciente.value = true
}

const abrirEdicaoPaciente = (p) => {
  editandoPaciente.value = true
  idEditando.value = p._id
  Object.assign(formPaciente, { nome: p.nome, email: p.email, senha: '', telefone: p.telefone || '', cpf: p.cpf || '', ativo: p.ativo })
  erroModal.value = ''
  modalPaciente.value = true
}

const salvarPaciente = async () => {
  if (!formPaciente.nome || !formPaciente.email) { erroModal.value = 'Nome e e-mail são obrigatórios'; return }
  if (!editandoPaciente.value && !formPaciente.senha) { erroModal.value = 'Senha é obrigatória'; return }
  salvando.value = true
  erroModal.value = ''
  try {
    if (editandoPaciente.value) {
      const payload = { ...formPaciente }
      delete payload.senha
      const { data } = await api.patch(`/admin/pacientes/${idEditando.value}`, payload)
      const idx = pacientesList.value.findIndex(p => p._id === idEditando.value)
      if (idx !== -1) pacientesList.value[idx] = { ...pacientesList.value[idx], ...data.usuario }
    } else {
      await api.post('/admin/pacientes', { ...formPaciente, perfil: 'paciente' })
      buscarPacientes()
    }
    modalPaciente.value = false
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar'
  } finally { salvando.value = false }
}

const confirmarExclusao = (p) => {
  pacienteParaExcluir.value = p
  erroModal.value = ''
  modalExclusao.value = true
}

const excluirPaciente = async () => {
  salvando.value = true
  erroModal.value = ''
  try {
    await api.delete(`/admin/pacientes/${pacienteParaExcluir.value._id}`)
    pacientesList.value = pacientesList.value.filter(p => p._id !== pacienteParaExcluir.value._id)
    modalExclusao.value = false
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao excluir'
  } finally { salvando.value = false }
}

// ---- Usuários ----
const buscarUsuarios = async () => {
  carregandoUs.value = true
  try {
    const params = {}
    if (buscaUsuario.value) params.busca = buscaUsuario.value
    if (filtroPerfilUsuario.value) params.perfil = filtroPerfilUsuario.value
    const { data } = await api.get('/admin/usuarios', { params })
    usuarios.value = (data.usuarios || []).filter(u => u.perfil !== 'paciente')
  } finally { carregandoUs.value = false }
}

const abrirCadastroUsuario = () => {
  editandoUsuario.value = false
  idEditando.value = null
  Object.assign(formUsuario, { nome: '', email: '', senha: '', perfil: 'secretario', telefone: '', ativo: true })
  erroModal.value = ''
  modalUsuario.value = true
}

const abrirEdicaoUsuario = (u) => {
  editandoUsuario.value = true
  idEditando.value = u._id
  Object.assign(formUsuario, { nome: u.nome, email: u.email, senha: '', perfil: u.perfil, telefone: u.telefone || '', ativo: u.ativo })
  erroModal.value = ''
  modalUsuario.value = true
}

const salvarUsuario = async () => {
  if (!formUsuario.nome || !formUsuario.email) { erroModal.value = 'Nome e e-mail são obrigatórios'; return }
  if (!editandoUsuario.value && !formUsuario.senha) { erroModal.value = 'Senha é obrigatória para novo usuário'; return }
  salvando.value = true
  erroModal.value = ''
  try {
    const payload = { ...formUsuario }
    if (!payload.senha) delete payload.senha
    if (editandoUsuario.value) {
      const { data } = await api.patch(`/admin/usuarios/${idEditando.value}`, payload)
      const idx = usuarios.value.findIndex(u => u._id === idEditando.value)
      if (idx !== -1) usuarios.value[idx] = { ...usuarios.value[idx], ...data.usuario }
    } else {
      await api.post('/admin/usuarios', payload)
      buscarUsuarios()
    }
    modalUsuario.value = false
  } catch (err) {
    erroModal.value = err.response?.data?.message || 'Erro ao salvar'
  } finally { salvando.value = false }
}

const formatarData = (d) => new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

onMounted(() => { buscarPacientes() })
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
.section-header { display: flex; gap: 16px; align-items: flex-start; }
.paginacao { display: flex; align-items: center; gap: 12px; justify-content: flex-end; padding-top: 12px; border-top: 1px solid var(--borda); }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px;
}
.modal { width: 100%; max-width: 560px; padding: 0; overflow: hidden; }
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--borda);
}
.modal-header h3 { font-size: 18px; font-family: var(--fonte-display); }
.modal-close {
  background: none; border: none; font-size: 18px; cursor: pointer;
  color: var(--texto-suave); padding: 4px 8px; border-radius: var(--radius-sm); transition: all 0.15s;
}
.modal-close:hover { background: var(--creme-escuro); }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 16px 24px; border-top: 1px solid var(--borda); background: var(--creme);
}
</style>
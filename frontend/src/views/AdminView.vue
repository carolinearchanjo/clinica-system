<template>
  <div>
    <h1 class="page-title-h1">Painel Administrativo</h1>

    <div class="tabs mt-3">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tab-btn"
        :class="{ ativo: tabAtiva === t.id }"
        @click="mudarTab(t.id)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- AGENDA -->
    <div v-if="tabAtiva === 'agenda'" class="mt-3">
      <div class="filtros card">
        <div class="filtros-row">
          <div class="form-group">
            <label class="form-label">Médico *</label>
            <select
              v-model="agendaFiltro.medicoId"
              class="form-input"
              @change="buscarAgenda"
            >
              <option value="">Selecione...</option>
              <option v-for="m in todosMedicos" :key="m._id" :value="m._id">
                {{ m.nome }} — {{ m.especialidade }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data *</label>
            <CalendarioAgendamento
              v-model="agendaFiltro.data"
              :medicoId="agendaFiltro.medicoId"
              :modoAdmin="true"
              @change="buscarAgenda"
            />
          </div>
          <div
            v-if="
              agendaFiltro.medicoId &&
              agendaFiltro.data &&
              !semAtendimento &&
              gradeAgenda.length
            "
            style="align-self: flex-end; display: flex; gap: 8px"
          >
            <button
              v-if="!bloqueiosDia"
              class="btn btn-sm btn-danger"
              @click="abrirBloqueioDia"
            >
              🔒 Bloquear dia
            </button>
            <button
              v-else
              class="btn btn-sm btn-secondary"
              @click="desbloquearDia"
            >
              🔓 Desbloquear dia
            </button>
          </div>
        </div>
      </div>

      <div v-if="carregandoAgenda" class="empty-state mt-3">
        <span class="spinner spinner-dark"></span>
      </div>
      <div
        v-else-if="!agendaFiltro.medicoId || !agendaFiltro.data"
        class="empty-state card mt-3"
      >
        <div class="icon">📅</div>
        <p>Selecione um médico e uma data para ver a agenda</p>
      </div>
      <div v-else-if="semAtendimento" class="empty-state card mt-3">
        <div class="icon">🚫</div>
        <p>Este médico não atende neste dia da semana</p>
      </div>
      <div v-else-if="gradeAgenda.length" class="mt-3">
        <div class="agenda-header card mb-2">
          <div>
            <div class="agenda-medico">{{ medicoSelecionadoNome }}</div>
            <div class="text-sm text-muted">
              {{ formatarDataExtenso(agendaFiltro.data) }}
            </div>
          </div>
          <div class="agenda-resumo">
            <span class="resumo-chip livre">{{ totalLivre }} livres</span>
            <span class="resumo-chip ocupado">{{ totalOcupado }} ocupados</span>
            <span v-if="totalBloqueado" class="resumo-chip bloqueado"
              >{{ totalBloqueado }} bloqueados</span
            >
          </div>
        </div>
        <div class="grade-horarios card">
          <div
            v-for="slot in gradeAgenda"
            :key="slot.horario"
            class="slot"
            :class="[
              slot.bloqueado
                ? 'slot-bloqueado'
                : slot.livre
                  ? 'slot-livre'
                  : 'slot-' + slot.agendamento?.status,
              slot.livre || slot.bloqueado ? 'slot-clicavel' : '',
            ]"
            @click="onClickSlot(slot)"
          >
            <div class="slot-hora">{{ slot.horario }}</div>
            <div v-if="slot.bloqueado" class="slot-info">
              <div class="slot-bloqueado-label">🔒 Bloqueado</div>
              <div v-if="slot.motivo" class="text-sm text-muted">
                {{ slot.motivo }}
              </div>
            </div>
            <div v-else-if="slot.livre" class="slot-info text-sm text-muted">
              Disponível — clique para bloquear
            </div>
            <div v-else class="slot-info">
              <div class="slot-paciente">
                {{ slot.agendamento?.paciente?.nome }}
              </div>
              <div class="text-sm text-muted">
                {{ slot.agendamento?.paciente?.telefone }}
              </div>
              <div
                v-if="slot.agendamento?.observacoes"
                class="text-sm text-muted"
                style="font-style: italic"
              >
                {{ slot.agendamento.observacoes }}
              </div>
            </div>
            <div class="slot-badge">
              <span
                v-if="!slot.livre && !slot.bloqueado"
                class="badge"
                :class="'badge-' + slot.agendamento?.status"
                >{{ slot.agendamento?.status }}</span
              >
              <span v-if="slot.bloqueado" class="desbloq-hint text-sm"
                >🔓 Desbloquear</span
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="
          agendaFiltro.medicoId && agendaFiltro.data && !carregandoAgenda
        "
        class="empty-state card mt-3"
      >
        <div class="icon">📅</div>
        <p>Nenhum horário configurado para este dia</p>
      </div>

      <!-- Modal bloqueio -->
      <div
        v-if="popoverBloqueio.visivel"
        class="modal-overlay"
        @click.self="popoverBloqueio.visivel = false"
      >
        <div class="modal card" style="max-width: 380px">
          <div class="modal-header">
            <h3>
              {{
                popoverBloqueio.horario
                  ? "Bloquear " + popoverBloqueio.horario
                  : "Bloquear dia inteiro"
              }}
            </h3>
            <button
              class="modal-close"
              @click="popoverBloqueio.visivel = false"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Motivo (opcional)</label>
              <input
                v-model="popoverBloqueio.motivo"
                type="text"
                class="form-input"
                placeholder="Ex: Reunião, consulta externa..."
                @keyup.enter="confirmarBloqueio"
              />
            </div>
            <div v-if="erroBloqueio" class="alert alert-erro mt-1">
              ⚠️ {{ erroBloqueio }}
            </div>
          </div>
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="popoverBloqueio.visivel = false"
            >
              Cancelar
            </button>
            <button
              class="btn btn-danger"
              :disabled="salvandoBloqueio"
              @click="confirmarBloqueio"
            >
              <span v-if="salvandoBloqueio" class="spinner"></span>
              🔒 Bloquear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MÉDICOS -->
    <div v-if="tabAtiva === 'medicos'" class="mt-3">
      <div class="section-header mb-2">
        <div class="filtros card" style="flex: 1">
          <div class="filtros-row">
            <div class="form-group" style="flex: 1">
              <label class="form-label">Buscar</label>
              <input
                v-model="buscaMedico"
                type="text"
                class="form-input"
                placeholder="Nome ou CRM..."
                @keyup.enter="buscarMedicos"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Especialidade</label>
              <select
                v-model="filtroEspecialidade"
                class="form-input"
                @change="buscarMedicos"
              >
                <option value="">Todas</option>
                <option v-for="e in especialidades" :key="e" :value="e">
                  {{ e }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select
                v-model="filtroAtivoMedico"
                class="form-input"
                @change="buscarMedicos"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
            <button
              class="btn btn-primary btn-sm"
              style="align-self: flex-end"
              @click="buscarMedicos"
            >
              Buscar
            </button>
          </div>
        </div>
        <button class="btn btn-primary" @click="abrirCadastroMedico">
          + Novo Médico
        </button>
      </div>
      <div v-if="carregandoMed" class="empty-state mt-3">
        <span class="spinner spinner-dark"></span>
      </div>
      <div v-else-if="medicos.length === 0" class="empty-state card mt-3">
        <div class="icon">👨‍⚕️</div>
        <p>Nenhum médico encontrado</p>
      </div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>CRM</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in medicos" :key="m._id">
              <td>{{ m.nome }}</td>
              <td class="text-sm">{{ m.especialidade }}</td>
              <td class="text-sm text-muted">{{ m.crm }}</td>
              <td class="text-sm text-muted">{{ m.telefone || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="m.ativo ? 'badge-confirmado' : 'badge-cancelado'"
                  >{{ m.ativo ? "Ativo" : "Inativo" }}</span
                >
              </td>
              <td>
                <div style="display: flex; gap: 6px">
                  <button
                    class="btn btn-sm btn-secondary"
                    @click="abrirEdicaoMedico(m)"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="confirmarExclusaoMedico(m)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PACIENTES -->
    <div v-if="tabAtiva === 'pacientes'" class="mt-3">
      <div class="section-header mb-2">
        <div class="filtros card" style="flex: 1">
          <div class="filtros-row">
            <div class="form-group" style="flex: 1">
              <label class="form-label">Buscar</label>
              <input
                v-model="buscaPaciente"
                type="text"
                class="form-input"
                placeholder="Nome, e-mail ou CPF..."
                @keyup.enter="buscarPacientes"
              />
            </div>
            <button
              class="btn btn-primary btn-sm"
              style="align-self: flex-end"
              @click="buscarPacientes"
            >
              Buscar
            </button>
          </div>
        </div>
        <button class="btn btn-primary" @click="abrirCadastroPaciente">
          + Novo Paciente
        </button>
      </div>
      <div v-if="carregandoPac" class="empty-state mt-3">
        <span class="spinner spinner-dark"></span>
      </div>
      <div v-else-if="pacientesList.length === 0" class="empty-state card mt-3">
        <div class="icon">👥</div>
        <p>Nenhum paciente encontrado</p>
      </div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pacientesList" :key="p._id">
              <td>{{ p.nome }}</td>
              <td class="text-sm">{{ p.email }}</td>
              <td class="text-sm text-muted">{{ p.telefone || "—" }}</td>
              <td class="text-sm text-muted">{{ p.cpf || "—" }}</td>
              <td>
                <span
                  class="badge"
                  :class="p.ativo ? 'badge-confirmado' : 'badge-cancelado'"
                  >{{ p.ativo ? "Ativo" : "Inativo" }}</span
                >
              </td>
              <td>
                <div style="display: flex; gap: 6px">
                  <button
                    class="btn btn-sm btn-secondary"
                    @click="abrirEdicaoPaciente(p)"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    @click="confirmarExclusao(p)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- USUÁRIOS -->
    <div v-if="tabAtiva === 'usuarios' && auth.isAdmin" class="mt-3">
      <div class="section-header mb-2">
        <div class="filtros card" style="flex: 1">
          <div class="filtros-row">
            <div class="form-group" style="flex: 1">
              <label class="form-label">Buscar</label>
              <input
                v-model="buscaUsuario"
                type="text"
                class="form-input"
                placeholder="Nome ou e-mail..."
                @keyup.enter="buscarUsuarios"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Perfil</label>
              <select
                v-model="filtroPerfilUsuario"
                class="form-input"
                @change="buscarUsuarios"
              >
                <option value="">Todos</option>
                <option value="secretario">Secretário</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              class="btn btn-primary btn-sm"
              style="align-self: flex-end"
              @click="buscarUsuarios"
            >
              Buscar
            </button>
          </div>
        </div>
        <button class="btn btn-primary" @click="abrirCadastroUsuario">
          + Novo Usuário
        </button>
      </div>
      <div v-if="carregandoUs" class="empty-state mt-3">
        <span class="spinner spinner-dark"></span>
      </div>
      <div v-else-if="usuarios.length === 0" class="empty-state card mt-3">
        <div class="icon">👤</div>
        <p>Nenhum usuário encontrado</p>
      </div>
      <div v-else class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u._id">
              <td>{{ u.nome }}</td>
              <td class="text-sm">{{ u.email }}</td>
              <td>
                <span class="badge badge-agendado">{{ u.perfil }}</span>
              </td>
              <td>
                <span
                  class="badge"
                  :class="u.ativo ? 'badge-confirmado' : 'badge-cancelado'"
                  >{{ u.ativo ? "Ativo" : "Inativo" }}</span
                >
              </td>
              <td class="text-sm text-muted">
                {{ formatarData(u.createdAt) }}
              </td>
              <td>
                <button
                  class="btn btn-sm btn-secondary"
                  @click="abrirEdicaoUsuario(u)"
                >
                  ✏️ Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL MÉDICO -->
    <div
      v-if="modalMedico"
      class="modal-overlay"
      @click.self="modalMedico = false"
    >
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editandoMedico ? "Editar Médico" : "Novo Médico" }}</h3>
          <button class="modal-close" @click="modalMedico = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label
              ><input
                v-model="formMedico.nome"
                type="text"
                class="form-input"
                placeholder="Dr(a). Nome Sobrenome"
              />
            </div>
            <div class="form-group">
              <label class="form-label">CRM *</label
              ><input
                v-model="formMedico.crm"
                type="text"
                class="form-input"
                placeholder="CRM/SP 123456"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Especialidade *</label>
              <input
                v-model="formMedico.especialidade"
                type="text"
                class="form-input"
                placeholder="Ex: Cardiologia"
                list="esp-list"
              />
              <datalist id="esp-list">
                <option v-for="e in especialidades" :key="e" :value="e" />
              </datalist>
            </div>
            <div class="form-group">
              <label class="form-label">Telefone</label
              ><input
                v-model="formMedico.telefone"
                type="text"
                class="form-input"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">E-mail</label
            ><input
              v-model="formMedico.email"
              type="text"
              class="form-input"
              placeholder="medico@clinica.com"
            />
          </div>
          <div class="form-group" v-if="editandoMedico">
            <label class="form-label">Status</label>
            <select v-model="formMedico.ativo" class="form-input">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Grade de Atendimento</label>
            <div class="grade-semanal">
              <div
                v-for="dia in formMedico.horariosSemana"
                :key="dia.dia"
                class="grade-dia"
              >
                <div class="grade-dia-header">
                  <label class="grade-dia-toggle">
                    <input type="checkbox" v-model="dia.ativo" />
                    <span class="grade-dia-nome">{{
                      nomeDiaSemana(dia.dia)
                    }}</span>
                  </label>
                  <button
                    v-if="dia.ativo"
                    type="button"
                    class="btn btn-sm btn-secondary"
                    style="padding: 3px 8px; font-size: 11px"
                    @click="selecionarTodos(dia)"
                  >
                    {{
                      dia.horarios.length === todosHorarios.length
                        ? "Limpar"
                        : "Todos"
                    }}
                  </button>
                </div>
                <div v-if="dia.ativo" class="grade-horarios-select">
                  <button
                    type="button"
                    v-for="h in todosHorarios"
                    :key="h"
                    class="h-btn"
                    :class="{ ativo: dia.horarios.includes(h) }"
                    @click="toggleHorario(dia, h)"
                  >
                    {{ h }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="erroModal" class="alert alert-erro mt-2">
            ⚠️ {{ erroModal }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalMedico = false">
            Cancelar
          </button>
          <button
            class="btn btn-primary"
            :disabled="salvando"
            @click="salvarMedico"
          >
            <span v-if="salvando" class="spinner"></span>
            {{
              salvando ? "Salvando..." : editandoMedico ? "Salvar" : "Cadastrar"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL PACIENTE -->
    <div
      v-if="modalPaciente"
      class="modal-overlay"
      @click.self="modalPaciente = false"
    >
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editandoPaciente ? "Editar Paciente" : "Novo Paciente" }}</h3>
          <button class="modal-close" @click="modalPaciente = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label
              ><input
                v-model="formPaciente.nome"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail *</label
              ><input
                v-model="formPaciente.email"
                type="text"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Telefone</label
              ><input
                v-model="formPaciente.telefone"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">CPF</label
              ><input
                v-model="formPaciente.cpf"
                type="text"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-group" v-if="!editandoPaciente">
            <label class="form-label">Senha *</label
            ><input
              v-model="formPaciente.senha"
              type="password"
              class="form-input"
              autocomplete="new-password"
            />
          </div>
          <div class="form-group" v-if="editandoPaciente">
            <label class="form-label">Status</label>
            <select v-model="formPaciente.ativo" class="form-input">
              <option :value="true">Ativo</option>
              <option :value="false">Inativo</option>
            </select>
          </div>
          <div v-if="erroModal" class="alert alert-erro mt-2">
            ⚠️ {{ erroModal }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalPaciente = false">
            Cancelar
          </button>
          <button
            class="btn btn-primary"
            :disabled="salvando"
            @click="salvarPaciente"
          >
            <span v-if="salvando" class="spinner"></span>
            {{
              salvando
                ? "Salvando..."
                : editandoPaciente
                  ? "Salvar"
                  : "Cadastrar"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL USUÁRIO -->
    <div
      v-if="modalUsuario"
      class="modal-overlay"
      @click.self="modalUsuario = false"
    >
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editandoUsuario ? "Editar Usuário" : "Novo Usuário" }}</h3>
          <button class="modal-close" @click="modalUsuario = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nome *</label
              ><input
                v-model="formUsuario.nome"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">E-mail *</label
              ><input
                v-model="formUsuario.email"
                type="text"
                class="form-input"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{
                editandoUsuario
                  ? "Nova senha (deixe em branco para manter)"
                  : "Senha *"
              }}</label>
              <input
                v-model="formUsuario.senha"
                type="password"
                class="form-input"
                autocomplete="new-password"
              />
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
              <label class="form-label">Telefone</label
              ><input
                v-model="formUsuario.telefone"
                type="text"
                class="form-input"
              />
            </div>
            <div class="form-group" v-if="editandoUsuario">
              <label class="form-label">Status</label>
              <select v-model="formUsuario.ativo" class="form-input">
                <option :value="true">Ativo</option>
                <option :value="false">Inativo</option>
              </select>
            </div>
          </div>
          <div v-if="erroModal" class="alert alert-erro mt-2">
            ⚠️ {{ erroModal }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalUsuario = false">
            Cancelar
          </button>
          <button
            class="btn btn-primary"
            :disabled="salvando"
            @click="salvarUsuario"
          >
            <span v-if="salvando" class="spinner"></span>
            {{
              salvando
                ? "Salvando..."
                : editandoUsuario
                  ? "Salvar"
                  : "Cadastrar"
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL EXCLUSÃO -->
    <div
      v-if="modalExclusao"
      class="modal-overlay"
      @click.self="modalExclusao = false"
    >
      <div class="modal card" style="max-width: 420px">
        <div class="modal-header">
          <h3>Confirmar Exclusão</h3>
          <button class="modal-close" @click="modalExclusao = false">✕</button>
        </div>
        <div class="modal-body">
          <p>
            Tem certeza que deseja excluir
            <strong>{{ itemParaExcluir?.nome }}</strong
            >?
          </p>
          <p class="text-sm text-muted mt-1">{{ mensagemExclusao }}</p>
          <div v-if="erroModal" class="alert alert-erro mt-2">
            ⚠️ {{ erroModal }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalExclusao = false">
            Cancelar
          </button>
          <button
            class="btn btn-danger"
            :disabled="salvando"
            @click="executarExclusao"
          >
            <span v-if="salvando" class="spinner"></span>
            {{ salvando ? "Excluindo..." : "Excluir" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import CalendarioAgendamento from '@/components/CalendarioAgendamento.vue'
import { ref, reactive, computed, onMounted } from "vue";
import { useAuthStore } from "@/store/auth";
import api from "@/services/api";

const auth = useAuthStore();

const tabs = [
  { id: "agenda", label: "🗓️ Agenda" },
  { id: "medicos", label: "👨‍⚕️ Médicos" },
  { id: "pacientes", label: "🧑‍⚕️ Pacientes" },
  ...(auth.isAdmin ? [{ id: "usuarios", label: "🔑 Usuários" }] : []),
];
const tabAtiva = ref("agenda");

const todosHorarios = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];
const diasSemana = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];
const nomeDiaSemana = (dia) =>
  ({
    domingo: "Domingo",
    segunda: "Segunda",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sábado",
  })[dia];
const toggleHorario = (dia, h) => {
  const i = dia.horarios.indexOf(h);
  if (i === -1) dia.horarios.push(h);
  else dia.horarios.splice(i, 1);
};
const selecionarTodos = (dia) => {
  dia.horarios =
    dia.horarios.length === todosHorarios.length ? [] : [...todosHorarios];
};
const gradeInicial = () =>
  diasSemana.map((dia) => ({ dia, ativo: false, horarios: [] }));

// Agenda
const agendaFiltro = reactive({ medicoId: "", data: "" });
const gradeAgenda = ref([]);
const carregandoAgenda = ref(false);
const semAtendimento = ref(false);
const bloqueiosDia = ref(null);
const todosMedicos = ref([]);
const salvandoBloqueio = ref(false);
const erroBloqueio = ref("");
const popoverBloqueio = reactive({ visivel: false, horario: null, motivo: "" });

const medicoSelecionadoNome = computed(() => {
  const m = todosMedicos.value.find((m) => m._id === agendaFiltro.medicoId);
  return m ? m.nome + " — " + m.especialidade : "";
});
const totalLivre = computed(
  () => gradeAgenda.value.filter((s) => s.livre).length,
);
const totalOcupado = computed(
  () => gradeAgenda.value.filter((s) => !s.livre && !s.bloqueado).length,
);
const totalBloqueado = computed(
  () => gradeAgenda.value.filter((s) => s.bloqueado).length,
);

const buscarAgenda = async () => {
  if (!agendaFiltro.medicoId || !agendaFiltro.data) return;
  carregandoAgenda.value = true;
  semAtendimento.value = false;
  bloqueiosDia.value = null;
  try {
    const { data } = await api.get("/admin/agenda-medico", {
      params: { medicoId: agendaFiltro.medicoId, data: agendaFiltro.data },
    });
    gradeAgenda.value = data.grade || [];
    semAtendimento.value = data.semAtendimento || false;
    bloqueiosDia.value = data.bloqueioDia || null;
  } catch {
    gradeAgenda.value = [];
  } finally {
    carregandoAgenda.value = false;
  }
};

const onClickSlot = (slot) => {
  if (!slot.livre && !slot.bloqueado) return;
  if (slot.bloqueado) {
    desbloquearHorario(slot);
    return;
  }
  popoverBloqueio.horario = slot.horario;
  popoverBloqueio.motivo = "";
  erroBloqueio.value = "";
  popoverBloqueio.visivel = true;
};

const abrirBloqueioDia = () => {
  popoverBloqueio.horario = null;
  popoverBloqueio.motivo = "";
  erroBloqueio.value = "";
  popoverBloqueio.visivel = true;
};

const confirmarBloqueio = async () => {
  salvandoBloqueio.value = true;
  erroBloqueio.value = "";
  try {
    await api.post("/bloqueios", {
      medicoId: agendaFiltro.medicoId,
      data: agendaFiltro.data,
      horario: popoverBloqueio.horario || undefined,
      motivo: popoverBloqueio.motivo,
    });
    popoverBloqueio.visivel = false;
    buscarAgenda();
  } catch (err) {
    erroBloqueio.value = err.response?.data?.message || "Erro ao bloquear";
  } finally {
    salvandoBloqueio.value = false;
  }
};

const desbloquearHorario = async (slot) => {
  if (!confirm("Desbloquear o horário " + slot.horario + "?")) return;
  try {
    await api.delete("/bloqueios/" + slot.bloqueioId);
    buscarAgenda();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao desbloquear");
  }
};

const desbloquearDia = async () => {
  if (!confirm("Desbloquear todos os bloqueios deste dia?")) return;
  try {
    await api.delete("/bloqueios/dia", {
      data: { medicoId: agendaFiltro.medicoId, data: agendaFiltro.data },
    });
    buscarAgenda();
  } catch (err) {
    alert(err.response?.data?.message || "Erro ao desbloquear");
  }
};

// Médicos
const medicos = ref([]);
const carregandoMed = ref(false);
const buscaMedico = ref("");
const filtroEspecialidade = ref("");
const filtroAtivoMedico = ref("");
const especialidades = ref([]);
const buscarMedicos = async () => {
  carregandoMed.value = true;
  try {
    const params = {};
    if (buscaMedico.value) params.busca = buscaMedico.value;
    if (filtroEspecialidade.value)
      params.especialidade = filtroEspecialidade.value;
    if (filtroAtivoMedico.value !== "") params.ativo = filtroAtivoMedico.value;
    const { data } = await api.get("/medicos", { params });
    medicos.value = data.medicos || [];
  } finally {
    carregandoMed.value = false;
  }
};
const carregarEspecialidades = async () => {
  try {
    const { data } = await api.get("/medicos/especialidades");
    especialidades.value = data.especialidades || [];
  } catch {}
};

// Pacientes
const pacientesList = ref([]);
const carregandoPac = ref(false);
const buscaPaciente = ref("");
const buscarPacientes = async () => {
  carregandoPac.value = true;
  try {
    const params = { perfil: "paciente" };
    if (buscaPaciente.value) params.busca = buscaPaciente.value;
    const { data } = await api.get("/admin/usuarios", { params });
    pacientesList.value = data.usuarios || [];
  } finally {
    carregandoPac.value = false;
  }
};

// Usuários
const usuarios = ref([]);
const carregandoUs = ref(false);
const buscaUsuario = ref("");
const filtroPerfilUsuario = ref("");
const buscarUsuarios = async () => {
  carregandoUs.value = true;
  try {
    const params = {};
    if (buscaUsuario.value) params.busca = buscaUsuario.value;
    if (filtroPerfilUsuario.value) params.perfil = filtroPerfilUsuario.value;
    const { data } = await api.get("/admin/usuarios", { params });
    usuarios.value = (data.usuarios || []).filter(
      (u) => u.perfil !== "paciente",
    );
  } finally {
    carregandoUs.value = false;
  }
};

// Modais
const modalMedico = ref(false);
const modalPaciente = ref(false);
const modalUsuario = ref(false);
const modalExclusao = ref(false);
const editandoMedico = ref(false);
const editandoPaciente = ref(false);
const editandoUsuario = ref(false);
const salvando = ref(false);
const erroModal = ref("");
const idEditando = ref(null);
const itemParaExcluir = ref(null);
const mensagemExclusao = ref("");
const tipoExclusao = ref("");

const formMedico = reactive({
  nome: "",
  especialidade: "",
  crm: "",
  telefone: "",
  email: "",
  ativo: true,
  horariosSemana: gradeInicial(),
});
const formPaciente = reactive({
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  cpf: "",
  ativo: true,
});
const formUsuario = reactive({
  nome: "",
  email: "",
  senha: "",
  perfil: "secretario",
  telefone: "",
  ativo: true,
});

const mudarTab = (id) => {
  tabAtiva.value = id;
  if (id === "medicos" && medicos.value.length === 0) {
    buscarMedicos();
    carregarEspecialidades();
  }
  if (id === "pacientes" && pacientesList.value.length === 0) buscarPacientes();
  if (id === "usuarios" && usuarios.value.length === 0) buscarUsuarios();
};

const abrirCadastroMedico = () => {
  editandoMedico.value = false;
  idEditando.value = null;
  Object.assign(formMedico, {
    nome: "",
    especialidade: "",
    crm: "",
    telefone: "",
    email: "",
    ativo: true,
  });
  formMedico.horariosSemana = gradeInicial();
  erroModal.value = "";
  modalMedico.value = true;
};
const abrirEdicaoMedico = (m) => {
  editandoMedico.value = true;
  idEditando.value = m._id;
  Object.assign(formMedico, {
    nome: m.nome,
    especialidade: m.especialidade,
    crm: m.crm,
    telefone: m.telefone || "",
    email: m.email || "",
    ativo: m.ativo,
  });
  formMedico.horariosSemana = diasSemana.map((dia) => {
    const e = m.horariosSemana?.find((h) => h.dia === dia);
    return e
      ? { dia, ativo: e.ativo, horarios: [...e.horarios] }
      : { dia, ativo: false, horarios: [] };
  });
  erroModal.value = "";
  modalMedico.value = true;
};
const salvarMedico = async () => {
  if (!formMedico.nome || !formMedico.especialidade || !formMedico.crm) {
    erroModal.value = "Nome, especialidade e CRM são obrigatórios";
    return;
  }
  salvando.value = true;
  erroModal.value = "";
  try {
    if (editandoMedico.value) {
      const { data } = await api.patch("/medicos/" + idEditando.value, {
        ...formMedico,
      });
      const i = medicos.value.findIndex((m) => m._id === idEditando.value);
      if (i !== -1) medicos.value[i] = data.medico;
      const j = todosMedicos.value.findIndex((m) => m._id === idEditando.value);
      if (j !== -1) todosMedicos.value[j] = data.medico;
    } else {
      const { data } = await api.post("/medicos", { ...formMedico });
      medicos.value.unshift(data.medico);
      todosMedicos.value.push(data.medico);
    }
    modalMedico.value = false;
    carregarEspecialidades();
  } catch (err) {
    erroModal.value = err.response?.data?.message || "Erro ao salvar";
  } finally {
    salvando.value = false;
  }
};
const confirmarExclusaoMedico = (m) => {
  itemParaExcluir.value = m;
  tipoExclusao.value = "medico";
  mensagemExclusao.value =
    "Médicos com agendamentos futuros não podem ser excluídos — desative-os em vez disso.";
  erroModal.value = "";
  modalExclusao.value = true;
};

const abrirCadastroPaciente = () => {
  editandoPaciente.value = false;
  idEditando.value = null;
  Object.assign(formPaciente, {
    nome: "",
    email: "",
    senha: "",
    telefone: "",
    cpf: "",
    ativo: true,
  });
  erroModal.value = "";
  modalPaciente.value = true;
};
const abrirEdicaoPaciente = (p) => {
  editandoPaciente.value = true;
  idEditando.value = p._id;
  Object.assign(formPaciente, {
    nome: p.nome,
    email: p.email,
    senha: "",
    telefone: p.telefone || "",
    cpf: p.cpf || "",
    ativo: p.ativo,
  });
  erroModal.value = "";
  modalPaciente.value = true;
};
const salvarPaciente = async () => {
  if (!formPaciente.nome || !formPaciente.email) {
    erroModal.value = "Nome e e-mail são obrigatórios";
    return;
  }
  if (!editandoPaciente.value && !formPaciente.senha) {
    erroModal.value = "Senha é obrigatória";
    return;
  }
  salvando.value = true;
  erroModal.value = "";
  try {
    if (editandoPaciente.value) {
      const payload = { ...formPaciente };
      delete payload.senha;
      const { data } = await api.patch(
        "/admin/pacientes/" + idEditando.value,
        payload,
      );
      const i = pacientesList.value.findIndex(
        (p) => p._id === idEditando.value,
      );
      if (i !== -1)
        pacientesList.value[i] = { ...pacientesList.value[i], ...data.usuario };
    } else {
      await api.post("/admin/pacientes", {
        ...formPaciente,
        perfil: "paciente",
      });
      buscarPacientes();
    }
    modalPaciente.value = false;
  } catch (err) {
    erroModal.value = err.response?.data?.message || "Erro ao salvar";
  } finally {
    salvando.value = false;
  }
};
const confirmarExclusao = (p) => {
  itemParaExcluir.value = p;
  tipoExclusao.value = "paciente";
  mensagemExclusao.value =
    "Esta ação cancelará todos os agendamentos futuros e não pode ser desfeita.";
  erroModal.value = "";
  modalExclusao.value = true;
};

const abrirCadastroUsuario = () => {
  editandoUsuario.value = false;
  idEditando.value = null;
  Object.assign(formUsuario, {
    nome: "",
    email: "",
    senha: "",
    perfil: "secretario",
    telefone: "",
    ativo: true,
  });
  erroModal.value = "";
  modalUsuario.value = true;
};
const abrirEdicaoUsuario = (u) => {
  editandoUsuario.value = true;
  idEditando.value = u._id;
  Object.assign(formUsuario, {
    nome: u.nome,
    email: u.email,
    senha: "",
    perfil: u.perfil,
    telefone: u.telefone || "",
    ativo: u.ativo,
  });
  erroModal.value = "";
  modalUsuario.value = true;
};
const salvarUsuario = async () => {
  if (!formUsuario.nome || !formUsuario.email) {
    erroModal.value = "Nome e e-mail são obrigatórios";
    return;
  }
  if (!editandoUsuario.value && !formUsuario.senha) {
    erroModal.value = "Senha é obrigatória";
    return;
  }
  salvando.value = true;
  erroModal.value = "";
  try {
    const payload = { ...formUsuario };
    if (!payload.senha) delete payload.senha;
    if (editandoUsuario.value) {
      const { data } = await api.patch(
        "/admin/usuarios/" + idEditando.value,
        payload,
      );
      const i = usuarios.value.findIndex((u) => u._id === idEditando.value);
      if (i !== -1)
        usuarios.value[i] = { ...usuarios.value[i], ...data.usuario };
    } else {
      await api.post("/admin/usuarios", payload);
      buscarUsuarios();
    }
    modalUsuario.value = false;
  } catch (err) {
    erroModal.value = err.response?.data?.message || "Erro ao salvar";
  } finally {
    salvando.value = false;
  }
};

const executarExclusao = async () => {
  salvando.value = true;
  erroModal.value = "";
  try {
    if (tipoExclusao.value === "medico") {
      await api.delete("/medicos/" + itemParaExcluir.value._id);
      medicos.value = medicos.value.filter(
        (m) => m._id !== itemParaExcluir.value._id,
      );
      todosMedicos.value = todosMedicos.value.filter(
        (m) => m._id !== itemParaExcluir.value._id,
      );
    } else {
      await api.delete("/admin/pacientes/" + itemParaExcluir.value._id);
      pacientesList.value = pacientesList.value.filter(
        (p) => p._id !== itemParaExcluir.value._id,
      );
    }
    modalExclusao.value = false;
  } catch (err) {
    erroModal.value = err.response?.data?.message || "Erro ao excluir";
  } finally {
    salvando.value = false;
  }
};

const formatarDataExtenso = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const formatarData = (d) =>
  new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });

onMounted(async () => {
  try {
    const { data } = await api.get("/medicos?ativo=true");
    todosMedicos.value = data.medicos || [];
  } catch {}
});
</script>

<style scoped>
.page-title-h1 {
  font-size: 26px;
}
.tabs {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid var(--borda);
  flex-wrap: wrap;
}
.tab-btn {
  padding: 10px 18px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--fonte-body);
  font-size: 14px;
  color: var(--texto-suave);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.15s;
}
.tab-btn.ativo {
  color: var(--verde);
  border-bottom-color: var(--verde);
  font-weight: 500;
}
.tab-btn:hover {
  color: var(--verde);
  background: var(--verde-pale);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}
.filtros {
  padding: 16px 20px;
}
.filtros-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filtros-row .form-group {
  min-width: 140px;
}
.section-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.agenda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}
.agenda-medico {
  font-size: 16px;
  font-weight: 500;
}
.agenda-resumo {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.resumo-chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.resumo-chip.livre {
  background: var(--verde-pale);
  color: var(--verde);
}
.resumo-chip.ocupado {
  background: var(--erro-pale);
  color: var(--erro);
}
.resumo-chip.bloqueado {
  background: #fff3e0;
  color: #e65100;
}
.grade-horarios {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.slot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  transition: all 0.12s;
}
.slot-clicavel {
  cursor: pointer;
}
.slot-clicavel:hover {
  filter: brightness(0.96);
  transform: translateX(2px);
}
.slot-hora {
  font-size: 14px;
  font-weight: 600;
  min-width: 48px;
  color: var(--texto-suave);
}
.slot-info {
  flex: 1;
  font-size: 13px;
}
.slot-paciente {
  font-weight: 500;
  color: var(--texto);
}
.slot-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.slot-livre {
  background: var(--creme);
  border-color: var(--creme-escuro);
}
.slot-livre .slot-hora {
  color: var(--verde-claro);
}
.slot-agendado {
  background: #eef2ff;
  border-color: #c7d2fe;
}
.slot-confirmado {
  background: var(--verde-pale);
  border-color: var(--verde-menta);
}
.slot-realizado {
  background: #f0f0f0;
  border-color: #ddd;
}
.slot-cancelado {
  background: var(--erro-pale);
  border-color: #e8b4af;
  opacity: 0.6;
}
.slot-bloqueado {
  background: #fff3e0;
  border-color: #ffcc80;
}
.slot-bloqueado .slot-hora {
  color: #e65100;
}
.slot-bloqueado-label {
  font-weight: 500;
  color: #e65100;
  font-size: 13px;
}
.desbloq-hint {
  color: var(--texto-suave);
  font-size: 12px;
  opacity: 0.7;
}
.grade-semanal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.grade-dia {
  border: 1px solid var(--borda);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.grade-dia-header {
  padding: 10px 14px;
  background: var(--creme-escuro);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.grade-dia-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.grade-dia-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--verde);
  cursor: pointer;
}
.grade-horarios-select {
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: var(--branco);
}
.h-btn {
  padding: 5px 10px;
  border: 1.5px solid var(--borda);
  border-radius: var(--radius-sm);
  background: var(--branco);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--fonte-body);
  color: var(--texto-suave);
  transition: all 0.12s;
}
.h-btn:hover {
  border-color: var(--verde-claro);
  color: var(--verde);
}
.h-btn.ativo {
  background: var(--verde);
  color: #fff;
  border-color: var(--verde);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
}
.modal {
  width: 100%;
  max-width: 580px;
  padding: 0;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--borda);
  flex-shrink: 0;
}
.modal-header h3 {
  font-size: 18px;
  font-family: var(--fonte-display);
}
.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--texto-suave);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}
.modal-close:hover {
  background: var(--creme-escuro);
}
.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
}
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid var(--borda);
  background: var(--creme);
  flex-shrink: 0;
}

/* Responsividade mobile */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
  .section-header .filtros {
    flex: unset;
  }
  .section-header > .btn {
    width: 100%;
    justify-content: center;
  }
  .filtros-row {
    flex-direction: column;
  }
  .filtros-row .form-group {
    min-width: unset;
    width: 100%;
  }
  .tabs {
    gap: 2px;
  }
  .tab-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  .agenda-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>

<template>
  <div>
    <div class="page-title">
      <RouterLink to="/dashboard" class="back-link">← Voltar</RouterLink>
      <h1>Agendar Consulta</h1>
    </div>

    <div class="agendar-layout mt-3">
      <div class="card form-card">
        <form @submit.prevent="agendar">
          <!-- Seleção de paciente (admin/secretário) -->
          <div v-if="auth.podeGerenciar" class="form-section">
            <h3>Paciente</h3>
            <div class="form-group" style="position: relative">
              <label class="form-label">Buscar e selecionar paciente</label>
              <input
                v-model="buscaPaciente"
                type="text"
                class="form-input"
                placeholder="Digite o nome ou e-mail..."
                @input="onBuscaPaciente"
                @blur="fecharDropdown"
                autocomplete="off"
              />
              <div
                v-if="mostrarDropdown && pacientes.length"
                class="paciente-dropdown"
              >
                <div
                  v-for="p in pacientes"
                  :key="p._id"
                  class="paciente-option"
                  @mousedown.prevent="selecionarPaciente(p)"
                >
                  <div class="paciente-nome">{{ p.nome }}</div>
                  <div class="text-sm text-muted">{{ p.email }}</div>
                </div>
              </div>
              <div
                v-if="
                  mostrarDropdown &&
                  buscaPaciente.length >= 2 &&
                  !pacientes.length
                "
                class="paciente-dropdown"
              >
                <div class="paciente-vazio text-sm text-muted">
                  Nenhum paciente encontrado
                </div>
              </div>
            </div>
            <div v-if="pacienteSelecionado" class="paciente-selecionado">
              <span>👤 {{ nomePacienteSelecionado }}</span>
              <button
                type="button"
                class="limpar-paciente"
                @click="limparPaciente"
              >
                ✕ Limpar
              </button>
            </div>
            <div v-else class="text-sm text-muted" style="font-style: italic">
              Sem paciente selecionado — agendamento será para sua própria conta
            </div>
          </div>

          <div class="form-section" :class="{ 'mt-3': auth.podeGerenciar }">
            <h3>Informações da Consulta</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Especialidade *</label>
                <select
                  v-model="form.especialidade"
                  class="form-input"
                  :class="{ error: erros.especialidade }"
                  @change="onEspecialidadeChange"
                >
                  <option value="">Selecione...</option>
                  <option v-for="e in especialidades" :key="e" :value="e">
                    {{ e }}
                  </option>
                </select>
                <span v-if="erros.especialidade" class="form-error">{{
                  erros.especialidade
                }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">Médico *</label>
                <select
                  v-model="form.medicoId"
                  class="form-input"
                  :class="{ error: erros.medicoId }"
                  :disabled="!form.especialidade || carregandoMedicos"
                  @change="onMedicoChange"
                >
                  <option value="">
                    {{
                      carregandoMedicos
                        ? "Carregando..."
                        : form.especialidade
                          ? "Selecione..."
                          : "Selecione a especialidade primeiro"
                    }}
                  </option>
                  <option
                    v-for="m in medicosFiltrados"
                    :key="m._id"
                    :value="m._id"
                  >
                    {{ m.nome }}
                  </option>
                </select>
                <span v-if="erros.medicoId" class="form-error">{{
                  erros.medicoId
                }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Data *</label>
                <CalendarioAgendamento
                  v-model="form.data"
                  :medicoId="form.medicoId"
                  @change="buscarDisponibilidade"
                />
                <span v-if="erros.data" class="form-error mt-1">{{
                  erros.data
                }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">Horário *</label>
                <div v-if="buscandoHorarios" class="text-sm text-muted">
                  🔄 Verificando...
                </div>
                <div
                  v-else-if="horariosDisponiveis.length"
                  class="horarios-grid"
                >
                  <button
                    type="button"
                    v-for="h in horariosDisponiveis"
                    :key="h"
                    class="horario-btn"
                    :class="{ selecionado: form.horario === h }"
                    @click="form.horario = h"
                  >
                    {{ h }}
                  </button>
                </div>
                <div
                  v-else-if="form.data && form.medicoId"
                  class="text-sm text-muted"
                >
                  Sem horários disponíveis nesta data
                </div>
                <div v-else class="text-sm text-muted">
                  Selecione médico e data
                </div>
                <span v-if="erros.horario" class="form-error">{{
                  erros.horario
                }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea
                v-model="form.observacoes"
                class="form-input"
                rows="3"
                placeholder="Sintomas, exames a trazer, etc."
              ></textarea>
            </div>
          </div>

          <div class="form-section mt-3">
            <h3>Local / Endereço de Referência</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">CEP</label>
                <div style="position: relative">
                  <input
                    v-model="form.cep"
                    type="text"
                    class="form-input"
                    placeholder="00000-000"
                    @blur="buscarCep"
                    maxlength="9"
                  />
                  <span
                    v-if="buscandoCep"
                    class="spinner spinner-dark"
                    style="
                      position: absolute;
                      right: 12px;
                      top: 50%;
                      transform: translateY(-50%);
                    "
                  ></span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Número</label>
                <input
                  v-model="form.numero"
                  type="text"
                  class="form-input"
                  placeholder="123"
                />
              </div>
            </div>
            <div v-if="form.logradouro" class="endereco-resumo text-sm mt-1">
              📍 {{ form.logradouro }}, {{ form.bairro }} — {{ form.cidade }}/{{
                form.uf
              }}
            </div>
          </div>

          <!-- Clima -->
          <div v-if="clima" class="clima-card mt-3">
            <div class="clima-header">
              <img :src="clima.icone" alt="" class="clima-icone" />
              <div>
                <div class="clima-desc">{{ clima.descricao }}</div>
                <div class="text-sm text-muted">
                  {{ clima.temperaturaMin }}° – {{ clima.temperaturaMax }}°C •
                  {{ clima.cidade }}
                </div>
              </div>
            </div>
            <div v-if="clima.alertaChuva" class="alert alert-chuva mt-2">
              🌧️ {{ clima.alertaChuva }}
            </div>
          </div>
          <div v-if="erroClima" class="alert alert-chuva mt-3">
            🌤️ {{ erroClima }}
          </div>
          <div v-if="erroGeral" class="alert alert-erro mt-2">
            ⚠️ {{ erroGeral }}
          </div>
          <div v-if="sucesso" class="alert alert-sucesso mt-2">
            ✅ {{ sucesso }}
          </div>

          <div class="form-actions mt-3">
            <RouterLink to="/dashboard" class="btn btn-secondary"
              >Cancelar</RouterLink
            >
            <button type="submit" class="btn btn-primary" :disabled="enviando">
              <span v-if="enviando" class="spinner"></span>
              {{ enviando ? "Agendando..." : "Confirmar Agendamento" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import { useAuthStore } from "@/store/auth";
import CalendarioAgendamento from "@/components/CalendarioAgendamento.vue";

const router = useRouter();
const auth = useAuthStore();

const buscandoCep = ref(false);
const buscandoHorarios = ref(false);
const carregandoMedicos = ref(false);
const enviando = ref(false);
const erroGeral = ref("");
const erroClima = ref("");
const sucesso = ref("");
const horariosDisponiveis = ref([]);
const clima = ref(null);
const especialidades = ref([]);
const todosMedicos = ref([]);
const medicosFiltrados = ref([]);

// Busca paciente (admin/secretário)
const pacientes = ref([]);
const pacienteSelecionado = ref("");
const nomePacienteSelecionado = ref("");
const buscaPaciente = ref("");
const mostrarDropdown = ref(false);
let debounceTimer = null;

const form = reactive({
  especialidade: "",
  medicoId: "",
  data: "",
  horario: "",
  observacoes: "",
  cep: "",
  logradouro: "",
  bairro: "",
  cidade: "",
  uf: "",
  numero: "",
});
const erros = reactive({
  especialidade: "",
  medicoId: "",
  data: "",
  horario: "",
});

watch(
  () => form.especialidade,
  () => {
    form.medicoId = "";
    form.data = "";
    form.horario = "";
    horariosDisponiveis.value = [];
  },
);

watch(
  () => form.cidade,
  () => {
    if (form.data) buscarClima();
  },
);

onMounted(async () => {
  try {
    const { data } = await api.get("/medicos?ativo=true");
    todosMedicos.value = data.medicos || [];
    const espSet = new Set(todosMedicos.value.map((m) => m.especialidade));
    especialidades.value = [...espSet].sort();
  } catch {}
});

const onEspecialidadeChange = () => {
  form.medicoId = "";
  form.data = "";
  form.horario = "";
  horariosDisponiveis.value = [];
  medicosFiltrados.value = todosMedicos.value.filter(
    (m) => m.especialidade === form.especialidade && m.ativo,
  );
};

const onMedicoChange = () => {
  form.data = "";
  form.horario = "";
  horariosDisponiveis.value = [];
};

// Dropdown paciente
const onBuscaPaciente = () => {
  mostrarDropdown.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => buscarPacientes(buscaPaciente.value), 300);
};
const buscarPacientes = async (busca) => {
  if (!busca || busca.length < 2) {
    pacientes.value = [];
    return;
  }
  try {
    const { data } = await api.get("/admin/pacientes", { params: { busca } });
    pacientes.value = data.pacientes || [];
  } catch {}
};
const selecionarPaciente = (p) => {
  pacienteSelecionado.value = p._id;
  nomePacienteSelecionado.value = `${p.nome} (${p.email})`;
  buscaPaciente.value = "";
  pacientes.value = [];
  mostrarDropdown.value = false;
};
const limparPaciente = () => {
  pacienteSelecionado.value = "";
  nomePacienteSelecionado.value = "";
  buscaPaciente.value = "";
};
const fecharDropdown = () => {
  setTimeout(() => {
    mostrarDropdown.value = false;
  }, 150);
};

const buscarDisponibilidade = async (data) => {
  const dataAlvo = data || form.data;
  if (!form.medicoId || !dataAlvo) return;
  if (data) form.data = data;
  buscandoHorarios.value = true;
  form.horario = "";
  try {
    const resp = await api.get("/agendamentos/disponibilidade", {
      params: { medicoId: form.medicoId, data: dataAlvo },
    });
    horariosDisponiveis.value = resp.data.horariosDisponiveis || [];
  } catch {
    horariosDisponiveis.value = [];
  } finally {
    buscandoHorarios.value = false;
  }
  buscarClima();
};

const buscarClima = async () => {
  if (!form.data) return;
  clima.value = null;
  erroClima.value = "";
  try {
    const { data } = await api.get("/clima", {
      params: { data: form.data, cidade: form.cidade || undefined },
    });
    if (data.success) clima.value = data.clima;
  } catch (err) {
    if (err.response?.status === 404)
      erroClima.value =
        "Previsão do tempo disponível apenas para os próximos 5 dias.";
  }
};

const buscarCep = async () => {
  const cep = form.cep.replace(/\D/g, "");
  if (cep.length !== 8) return;
  buscandoCep.value = true;
  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await resp.json();
    if (!data.erro) {
      form.logradouro = data.logradouro;
      form.bairro = data.bairro;
      form.cidade = data.localidade;
      form.uf = data.uf;
      buscarClima();
    }
  } catch {
  } finally {
    buscandoCep.value = false;
  }
};

const validar = () => {
  Object.keys(erros).forEach((k) => (erros[k] = ""));
  let ok = true;
  if (!form.especialidade) {
    erros.especialidade = "Selecione a especialidade";
    ok = false;
  }
  if (!form.medicoId) {
    erros.medicoId = "Selecione o médico";
    ok = false;
  }
  if (!form.data) {
    erros.data = "Selecione a data";
    ok = false;
  }
  if (!form.horario) {
    erros.horario = "Selecione o horário";
    ok = false;
  }
  return ok;
};

const agendar = async () => {
  if (!validar()) return;
  enviando.value = true;
  erroGeral.value = "";
  try {
    await api.post("/agendamentos", {
      pacienteId: pacienteSelecionado.value || undefined,
      medicoId: form.medicoId,
      data: form.data,
      horario: form.horario,
      observacoes: form.observacoes,
      enderecoConsulta: form.logradouro
        ? {
            cep: form.cep,
            logradouro: form.logradouro,
            bairro: form.bairro,
            cidade: form.cidade,
            uf: form.uf,
          }
        : undefined,
    });
    sucesso.value = "Consulta agendada com sucesso!";
    setTimeout(() => router.push("/agendamentos"), 1500);
  } catch (err) {
    erroGeral.value = err.response?.data?.message || "Erro ao agendar";
  } finally {
    enviando.value = false;
  }
};
</script>

<style scoped>
.page-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.back-link {
  font-size: 13px;
  color: var(--texto-suave);
}
.page-title h1 {
  font-size: 26px;
}
.agendar-layout {
  max-width: 720px;
}
.form-section h3 {
  font-size: 16px;
  font-family: var(--fonte-display);
  margin-bottom: 16px;
  color: var(--verde);
}
.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.horarios-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.horario-btn {
  padding: 7px 13px;
  border: 1.5px solid var(--borda);
  border-radius: var(--radius-sm);
  background: var(--branco);
  cursor: pointer;
  font-size: 13px;
  font-family: var(--fonte-body);
  transition: all 0.15s;
  color: var(--texto);
}
.horario-btn:hover {
  border-color: var(--verde-claro);
  background: var(--verde-pale);
}
.horario-btn.selecionado {
  background: var(--verde);
  color: #fff;
  border-color: var(--verde);
}
.clima-card {
  background: var(--creme-escuro);
  border-radius: var(--radius-sm);
  padding: 14px;
  border: 1px solid var(--borda);
}
.clima-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.clima-icone {
  width: 48px;
  height: 48px;
}
.clima-desc {
  text-transform: capitalize;
  font-weight: 500;
}
.endereco-resumo {
  background: var(--verde-pale);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  color: var(--verde);
  border: 1px solid var(--verde-menta);
}
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  .form-actions .btn,
  .form-actions a {
    width: 100%;
    justify-content: center;
    text-align: center;
  }
}
.paciente-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--branco);
  border: 1.5px solid var(--verde-claro);
  border-radius: var(--radius-sm);
  box-shadow: var(--sombra-hover);
  z-index: 50;
  max-height: 220px;
  overflow-y: auto;
}
.paciente-option {
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--creme-escuro);
  transition: background 0.12s;
}
.paciente-option:last-child {
  border-bottom: none;
}
.paciente-option:hover {
  background: var(--verde-pale);
}
.paciente-nome {
  font-weight: 500;
}
.paciente-vazio {
  padding: 12px 14px;
}
.paciente-selecionado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--verde-pale);
  border: 1px solid var(--verde-menta);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 13px;
  color: var(--verde);
  font-weight: 500;
}
.limpar-paciente {
  background: none;
  border: 1px solid var(--verde-menta);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--verde);
  font-size: 12px;
  padding: 3px 8px;
  transition: all 0.15s;
}
.limpar-paciente:hover {
  background: var(--verde);
  color: #fff;
}
</style>

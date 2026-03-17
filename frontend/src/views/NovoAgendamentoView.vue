<template>
  <div>
    <div class="page-title">
      <RouterLink to="/dashboard" class="back-link">← Voltar</RouterLink>
      <h1>Agendar Consulta</h1>
    </div>

    <div class="agendar-layout mt-3">
      <div class="card form-card">
        <form @submit.prevent="agendar">
          <div class="form-section">
            <h3>Informações da Consulta</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Especialidade *</label>
                <select
                  v-model="form.especialidade"
                  class="form-input"
                  :class="{ error: erros.especialidade }"
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
                  v-model="form.medico"
                  class="form-input"
                  :class="{ error: erros.medico }"
                >
                  <option value="">Selecione...</option>
                  <option v-for="m in medicosFiltrados" :key="m" :value="m">
                    {{ m }}
                  </option>
                </select>
                <span v-if="erros.medico" class="form-error">{{
                  erros.medico
                }}</span>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Data *</label>
                <input
                  v-model="form.data"
                  type="date"
                  class="form-input"
                  :class="{ error: erros.data }"
                  :min="dataMinima"
                  @change="buscarDisponibilidade"
                />
                <span v-if="erros.data" class="form-error">{{
                  erros.data
                }}</span>
              </div>
              <div class="form-group">
                <label class="form-label">Horário *</label>
                <div
                  v-if="buscandoHorarios"
                  class="horarios-loading text-sm text-muted"
                >
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
                  v-else-if="form.data && form.medico"
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

          <!-- Alerta de clima -->
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
import { reactive, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";

const router = useRouter();
const buscandoCep = ref(false);
const buscandoHorarios = ref(false);
const enviando = ref(false);
const erroGeral = ref("");
const sucesso = ref("");
const horariosDisponiveis = ref([]);
const clima = ref(null);
const erroClima = ref("");

const especialidades = [
  "Clínica Geral",
  "Cardiologia",
  "Dermatologia",
  "Ginecologia",
  "Neurologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
];
const medicos = {
  "Clínica Geral": ["Dr. Carlos Mendes", "Dra. Ana Lima"],
  Cardiologia: ["Dr. Roberto Faria", "Dra. Patricia Souza"],
  Dermatologia: ["Dra. Juliana Costa", "Dr. Marcos Pinto"],
  Ginecologia: ["Dra. Fernanda Alves", "Dra. Camila Rocha"],
  Neurologia: ["Dr. Eduardo Neves"],
  Ortopedia: ["Dr. Sérgio Mota", "Dr. Ricardo Leal"],
  Pediatria: ["Dra. Beatriz Santos", "Dr. Lucas Ferreira"],
  Psiquiatria: ["Dra. Mônica Vieira"],
};

const medicosFiltrados = computed(() => medicos[form.especialidade] || []);

const form = reactive({
  especialidade: "",
  medico: "",
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
  medico: "",
  data: "",
  horario: "",
});

const dataMinima = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
});

watch(
  () => form.especialidade,
  () => {
    form.medico = "";
    horariosDisponiveis.value = [];
  },
);
watch(
  () => form.medico,
  () => {
    if (form.data) buscarDisponibilidade();
  },
);
watch(
  () => form.cidade,
  () => {
    if (form.data) buscarClima();
  },
);

const buscarDisponibilidade = async () => {
  if (!form.medico || !form.data) return;
  buscandoHorarios.value = true;
  form.horario = "";
  try {
    const { data } = await api.get("/agendamentos/disponibilidade", {
      params: { medico: form.medico, data: form.data },
    });
    horariosDisponiveis.value = data.horariosDisponiveis || [];
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
      params: {
        data: form.data,
        cidade: form.cidade || undefined,
      },
    });
    if (data.success) clima.value = data.clima;
  } catch (err) {
    if (err.response?.status === 404) {
      erroClima.value =
        "Previsão do tempo disponível apenas para os próximos 5 dias.";
    }
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
  if (!form.medico) {
    erros.medico = "Selecione o médico";
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
      medico: form.medico,
      especialidade: form.especialidade,
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
  max-width: 680px;
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
}
</style>

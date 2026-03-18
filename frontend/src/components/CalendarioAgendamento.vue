<template>
  <div class="calendario">
    <div class="cal-header">
      <button
        type="button"
        class="cal-nav"
        @click="mesAnterior"
        :disabled="!podeMesAnterior"
      >
        ‹
      </button>
      <div class="cal-titulo">{{ nomeMes }} {{ anoAtual }}</div>
      <button type="button" class="cal-nav" @click="proximoMes">›</button>
    </div>

    <div class="cal-grid">
      <div v-for="d in diasSemanaLabel" :key="d" class="cal-dia-label">
        {{ d }}
      </div>
      <div
        v-for="n in inicioPrimeiroDia"
        :key="'v' + n"
        class="cal-celula vazio"
      ></div>

      <button
        v-for="dia in diasDoMes"
        :key="dia.data"
        type="button"
        class="cal-celula"
        :class="{
          hoje: dia.hoje,
          selecionado: dia.data === modelValue,
          disponivel: dia.disponivel,
          indisponivel: !dia.disponivel,
          passado: dia.passado && !modoAdmin,
          bloqueado: dia.bloqueado && !modoAdmin,
        }"
        :disabled="
          !modoAdmin && (!dia.disponivel || dia.passado || dia.bloqueado)
        "
        @click="selecionar(dia)"
      >
        <span class="cal-num">{{ dia.numero }}</span>
        <span
          v-if="dia.disponivel && (!dia.bloqueado || modoAdmin)"
          class="cal-dot"
        ></span>
        <span
          v-if="dia.bloqueado && modoAdmin"
          class="cal-dot bloqueado-dot"
        ></span>
      </button>
    </div>

    <div class="cal-legenda">
      <div class="legenda-item">
        <span class="legenda-dot disponivel"></span> Com horários
      </div>
      <div class="legenda-item">
        <span class="legenda-dot indisponivel"></span> Sem atendimento
      </div>
      <div v-if="modoAdmin" class="legenda-item">
        <span class="legenda-dot bloqueado"></span> Bloqueado
      </div>
    </div>

    <div v-if="carregando" class="cal-loading text-sm text-muted">
      🔄 Verificando disponibilidade...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import api from "@/services/api";

const props = defineProps({
  modelValue: { type: String, default: "" },
  medicoId: { type: String, default: "" },
  modoAdmin: { type: Boolean, default: false }, // sem restrição de data passada, todos os dias clicáveis
});

const emit = defineEmits(["update:modelValue", "change"]);

const hoje = new Date();
hoje.setHours(0, 0, 0, 0);
const amanha = new Date(hoje);
amanha.setDate(amanha.getDate() + 1);

const mesAtual = ref(hoje.getMonth());
const anoAtual = ref(hoje.getFullYear());
const carregando = ref(false);
const diasComAtendimento = ref(new Set());
const diasBloqueados = ref(new Set());

const diasSemanaLabel = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const nomesMeses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const nomesDB = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

const nomeMes = computed(() => nomesMeses[mesAtual.value]);

const podeMesAnterior = computed(() => {
  if (props.modoAdmin) return true; // admin pode navegar para meses passados
  return (
    anoAtual.value > hoje.getFullYear() ||
    (anoAtual.value === hoje.getFullYear() && mesAtual.value > hoje.getMonth())
  );
});

const inicioPrimeiroDia = computed(() => {
  return new Date(anoAtual.value, mesAtual.value, 1).getDay();
});

const diasDoMes = computed(() => {
  const total = new Date(anoAtual.value, mesAtual.value + 1, 0).getDate();
  const dias = [];
  for (let i = 1; i <= total; i++) {
    const data = new Date(anoAtual.value, mesAtual.value, i);
    const dataStr = data.toISOString().split("T")[0];
    const diaSemana = data.getDay();
    const nomeDia = nomesDB[diaSemana];
    const passado = data < amanha;
    const bloqueado = diasBloqueados.value.has(dataStr);
    const disponivel = diasComAtendimento.value.has(nomeDia);

    dias.push({
      numero: i,
      data: dataStr,
      passado,
      bloqueado,
      disponivel,
      hoje: data.toDateString() === hoje.toDateString(),
    });
  }
  return dias;
});

const carregarDadosMedico = async () => {
  if (!props.medicoId) {
    diasComAtendimento.value = new Set();
    diasBloqueados.value = new Set();
    return;
  }
  carregando.value = true;
  try {
    const { data } = await api.get(`/medicos/${props.medicoId}`);
    const medico = data.medico;
    diasComAtendimento.value = new Set(
      (medico.horariosSemana || [])
        .filter((h) => h.ativo && h.horarios?.length > 0)
        .map((h) => h.dia),
    );
    await carregarBloqueiosMes();
  } catch {
    diasComAtendimento.value = new Set();
  } finally {
    carregando.value = false;
  }
};

const carregarBloqueiosMes = async () => {
  if (!props.medicoId) return;
  try {
    const ano = anoAtual.value;
    const mes = mesAtual.value;
    const inicio = new Date(ano, mes, 1).toISOString().split("T")[0];
    const fim = new Date(ano, mes + 1, 0).toISOString().split("T")[0];
    const { data } = await api.get("/bloqueios/mes", {
      params: { medicoId: props.medicoId, inicio, fim },
    });
    diasBloqueados.value = new Set(data.diasBloqueados || []);
  } catch {
    diasBloqueados.value = new Set();
  }
};

const mesAnterior = () => {
  if (!podeMesAnterior.value) return;
  if (mesAtual.value === 0) {
    mesAtual.value = 11;
    anoAtual.value--;
  } else mesAtual.value--;
  carregarBloqueiosMes();
};

const proximoMes = () => {
  if (mesAtual.value === 11) {
    mesAtual.value = 0;
    anoAtual.value++;
  } else mesAtual.value++;
  carregarBloqueiosMes();
};

const selecionar = (dia) => {
  if (!props.modoAdmin && (!dia.disponivel || dia.passado || dia.bloqueado))
    return;
  emit("update:modelValue", dia.data);
  emit("change", dia.data);
};

watch(
  () => props.medicoId,
  () => {
    // Volta para o mês atual ao trocar de médico
    mesAtual.value = hoje.getMonth();
    anoAtual.value = hoje.getFullYear();
    carregarDadosMedico();
  },
);
onMounted(() => {
  if (props.medicoId) carregarDadosMedico();
});
</script>

<style scoped>
.calendario {
  background: var(--branco);
  border: 1.5px solid var(--borda);
  border-radius: var(--radius);
  padding: 16px;
  user-select: none;
}
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.cal-titulo {
  font-family: var(--fonte-display);
  font-size: 15px;
  color: var(--texto);
}
.cal-nav {
  background: none;
  border: 1px solid var(--borda);
  border-radius: var(--radius-sm);
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 18px;
  color: var(--texto-suave);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}
.cal-nav:hover:not(:disabled) {
  background: var(--verde-pale);
  border-color: var(--verde-claro);
  color: var(--verde);
}
.cal-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}
.cal-dia-label {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--texto-suave);
  padding: 4px 0 8px;
  text-transform: uppercase;
}
.cal-celula {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  font-family: var(--fonte-body);
  transition: all 0.12s;
  gap: 2px;
}
.cal-celula.vazio {
  pointer-events: none;
}
.cal-num {
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}
.cal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--verde);
}
.cal-dot.bloqueado-dot {
  background: #e65100;
}

/* Estados */
.cal-celula.disponivel {
  color: var(--texto);
}
.cal-celula.disponivel:hover {
  background: var(--verde-pale);
  color: var(--verde);
}
.cal-celula.disponivel .cal-num {
  color: var(--verde);
  font-weight: 600;
}
.cal-celula.selecionado {
  background: var(--verde) !important;
  color: #fff !important;
}
.cal-celula.selecionado .cal-num {
  color: #fff !important;
}
.cal-celula.selecionado .cal-dot {
  background: rgba(255, 255, 255, 0.7);
}
.cal-celula.hoje:not(.selecionado) {
  border: 1.5px solid var(--verde-claro);
}
.cal-celula.passado {
  opacity: 0.3;
  cursor: not-allowed;
}
.cal-celula.indisponivel:not(.passado) {
  opacity: 0.45;
  cursor: not-allowed;
}
.cal-celula.bloqueado:not(.passado) {
  opacity: 0.35;
  cursor: not-allowed;
  background: #fff3e0;
}
.cal-celula:disabled {
  cursor: not-allowed;
}

/* Legenda */
.cal-legenda {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--creme-escuro);
  flex-wrap: wrap;
}
.legenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--texto-suave);
}
.legenda-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legenda-dot.disponivel {
  background: var(--verde);
}
.legenda-dot.indisponivel {
  background: var(--borda);
}
.legenda-dot.bloqueado {
  background: #e65100;
}
.cal-loading {
  text-align: center;
  margin-top: 8px;
}
</style>

<template>
  <div class="calendario">
    <!-- Cabeçalho do mês -->
    <div class="cal-header">
      <button type="button" class="cal-nav" @click="mesAnterior" :disabled="!podeMesAnterior">‹</button>
      <div class="cal-titulo">{{ nomeMes }} {{ anoAtual }}</div>
      <button type="button" class="cal-nav" @click="proximoMes">›</button>
    </div>

    <!-- Dias da semana -->
    <div class="cal-grid">
      <div v-for="d in diasSemanaLabel" :key="d" class="cal-dia-label">{{ d }}</div>

      <!-- Células vazias do início -->
      <div v-for="n in inicioPrimeiroDia" :key="'v' + n" class="cal-celula vazio"></div>

      <!-- Dias do mês -->
      <button
        v-for="dia in diasDoMes"
        :key="dia.data"
        type="button"
        class="cal-celula"
        :class="{
          hoje: dia.hoje,
          selecionado: dia.data === modelValue,
          disponivel: dia.disponivel && !dia.passado,
          indisponivel: !dia.disponivel || dia.passado,
          passado: dia.passado,
          bloqueado: dia.bloqueado
        }"
        :disabled="!dia.disponivel || dia.passado || dia.bloqueado"
        @click="selecionar(dia)"
      >
        <span class="cal-num">{{ dia.numero }}</span>
        <span v-if="dia.disponivel && !dia.passado && !dia.bloqueado" class="cal-dot"></span>
      </button>
    </div>

    <!-- Legenda -->
    <div class="cal-legenda">
      <div class="legenda-item"><span class="legenda-dot disponivel"></span> Com horários</div>
      <div class="legenda-item"><span class="legenda-dot indisponivel"></span> Sem atendimento</div>
    </div>

    <div v-if="carregando" class="cal-loading text-sm text-muted">🔄 Verificando disponibilidade...</div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  modelValue: { type: String, default: '' }, // data selecionada YYYY-MM-DD
  medicoId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const hoje = new Date()
hoje.setHours(0, 0, 0, 0)
const amanha = new Date(hoje)
amanha.setDate(amanha.getDate() + 1)

const mesAtual = ref(hoje.getMonth())
const anoAtual = ref(hoje.getFullYear())
const carregando = ref(false)
const diasComAtendimento = ref(new Set()) // dias da semana que o médico atende: 'domingo','segunda',...
const diasBloqueados = ref(new Set()) // datas YYYY-MM-DD com bloqueio de dia inteiro

const diasSemanaLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const nomesDB = ['domingo','segunda','terca','quarta','quinta','sexta','sabado']

const nomeMes = computed(() => nomesMeses[mesAtual.value])

const podeMesAnterior = computed(() => {
  return anoAtual.value > hoje.getFullYear() ||
    (anoAtual.value === hoje.getFullYear() && mesAtual.value > hoje.getMonth())
})

const inicioPrimeiroDia = computed(() => {
  return new Date(anoAtual.value, mesAtual.value, 1).getDay()
})

const diasDoMes = computed(() => {
  const total = new Date(anoAtual.value, mesAtual.value + 1, 0).getDate()
  const dias = []
  for (let i = 1; i <= total; i++) {
    const data = new Date(anoAtual.value, mesAtual.value, i)
    const dataStr = data.toISOString().split('T')[0]
    const diaSemana = data.getDay()
    const nomeDia = nomesDB[diaSemana]
    const passado = data < amanha
    const bloqueado = diasBloqueados.value.has(dataStr)
    const disponivel = diasComAtendimento.value.has(nomeDia)

    dias.push({
      numero: i,
      data: dataStr,
      passado,
      bloqueado,
      disponivel,
      hoje: data.toDateString() === hoje.toDateString()
    })
  }
  return dias
})

const carregarDadosMedico = async () => {
  if (!props.medicoId) {
    diasComAtendimento.value = new Set()
    diasBloqueados.value = new Set()
    return
  }
  carregando.value = true
  try {
    // Busca horários do médico
    const { data } = await api.get(`/medicos/${props.medicoId}`)
    const medico = data.medico
    const diasAtivos = new Set(
      (medico.horariosSemana || [])
        .filter(h => h.ativo && h.horarios?.length > 0)
        .map(h => h.dia)
    )
    diasComAtendimento.value = diasAtivos

    // Busca bloqueios de dia inteiro do mês atual e próximo
    await carregarBloqueiosMes()
  } catch {
    diasComAtendimento.value = new Set()
  } finally {
    carregando.value = false
  }
}

const carregarBloqueiosMes = async () => {
  if (!props.medicoId) return
  try {
    // Busca bloqueios do mês visível
    const ano = anoAtual.value
    const mes = mesAtual.value
    const inicio = new Date(ano, mes, 1).toISOString().split('T')[0]
    const fim = new Date(ano, mes + 1, 0).toISOString().split('T')[0]
    const { data } = await api.get('/bloqueios/mes', {
      params: { medicoId: props.medicoId, inicio, fim }
    })
    diasBloqueados.value = new Set(data.diasBloqueados || [])
  } catch {
    diasBloqueados.value = new Set()
  }
}

const mesAnterior = () => {
  if (!podeMesAnterior.value) return
  if (mesAtual.value === 0) { mesAtual.value = 11; anoAtual.value-- }
  else mesAtual.value--
  carregarBloqueiosMes()
}

const proximoMes = () => {
  if (mesAtual.value === 11) { mesAtual.value = 0; anoAtual.value++ }
  else mesAtual.value++
  carregarBloqueiosMes()
}

const selecionar = (dia) => {
  if (!dia.disponivel || dia.passado || dia.bloqueado) return
  emit('update:modelValue', dia.data)
  emit('change', dia.data)
}

watch(() => props.medicoId, () => { carregarDadosMedico() })
onMounted(() => { if (props.medicoId) carregarDadosMedico() })
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
  width: 30px; height: 30px;
  cursor: pointer;
  font-size: 18px;
  color: var(--texto-suave);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}
.cal-nav:hover:not(:disabled) { background: var(--verde-pale); border-color: var(--verde-claro); color: var(--verde); }
.cal-nav:disabled { opacity: 0.3; cursor: not-allowed; }

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
.cal-celula.vazio { pointer-events: none; }

.cal-num { font-size: 13px; font-weight: 500; line-height: 1; }
.cal-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--verde);
}

/* Estados */
.cal-celula.disponivel:not(.passado):not(.bloqueado) {
  color: var(--texto);
}
.cal-celula.disponivel:not(.passado):not(.bloqueado):hover {
  background: var(--verde-pale);
  color: var(--verde);
}
.cal-celula.disponivel:not(.passado):not(.bloqueado) .cal-num {
  color: var(--verde);
  font-weight: 600;
}
.cal-celula.selecionado {
  background: var(--verde) !important;
  color: #fff !important;
}
.cal-celula.selecionado .cal-num { color: #fff !important; }
.cal-celula.selecionado .cal-dot { background: rgba(255,255,255,0.7); }

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
.cal-celula:disabled { cursor: not-allowed; }

/* Legenda */
.cal-legenda {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--creme-escuro);
}
.legenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--texto-suave);
}
.legenda-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
}
.legenda-dot.disponivel { background: var(--verde); }
.legenda-dot.indisponivel { background: var(--borda); }

.cal-loading {
  text-align: center;
  margin-top: 8px;
}
</style>

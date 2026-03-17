<template>
  <div style="max-width: 580px;">
    <h1>Meu Perfil</h1>

    <div class="card mt-3">
      <div class="perfil-header">
        <div class="avatar-grande">{{ iniciais }}</div>
        <div>
          <div class="perfil-nome">{{ auth.usuario?.nome }}</div>
          <div class="text-sm text-muted">{{ auth.usuario?.email }}</div>
          <span class="badge badge-confirmado mt-1">{{ auth.usuario?.perfil }}</span>
        </div>
      </div>

      <form @submit.prevent="salvar" class="mt-3" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group">
          <label class="form-label">Nome completo</label>
          <input v-model="form.nome" type="text" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Telefone</label>
          <input v-model="form.telefone" type="tel" class="form-input" placeholder="(11) 99999-9999" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">CEP</label>
            <input v-model="form.cep" type="text" class="form-input" placeholder="00000-000" @blur="buscarCep" maxlength="9" />
          </div>
          <div class="form-group">
            <label class="form-label">Número</label>
            <input v-model="form.numero" type="text" class="form-input" />
          </div>
        </div>
        <div v-if="form.logradouro" class="text-sm" style="color:var(--verde)">
          📍 {{ form.logradouro }}, {{ form.bairro }} — {{ form.cidade }}/{{ form.uf }}
        </div>

        <div v-if="sucesso" class="alert alert-sucesso">✅ {{ sucesso }}</div>
        <div v-if="erro" class="alert alert-erro">⚠️ {{ erro }}</div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="submit" class="btn btn-primary" :disabled="salvando">
            <span v-if="salvando" class="spinner"></span>
            {{ salvando ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()
const salvando = ref(false)
const sucesso = ref('')
const erro = ref('')

const iniciais = computed(() => {
  return (auth.usuario?.nome || '').split(' ').slice(0,2).map(p => p[0]).join('').toUpperCase()
})

const form = reactive({ nome: '', telefone: '', cep: '', logradouro: '', bairro: '', cidade: '', uf: '', numero: '' })

const buscarCep = async () => {
  const cep = form.cep.replace(/\D/g, '')
  if (cep.length !== 8) return
  try {
    const { data } = await api.get(`/cep/${cep}`)
    if (data.success) {
      form.logradouro = data.endereco.logradouro
      form.bairro = data.endereco.bairro
      form.cidade = data.endereco.cidade
      form.uf = data.endereco.uf
    }
  } catch {}
}

const salvar = async () => {
  salvando.value = true
  sucesso.value = ''; erro.value = ''
  try {
    await api.put('/auth/perfil', {
      nome: form.nome,
      telefone: form.telefone,
      endereco: { cep: form.cep, logradouro: form.logradouro, bairro: form.bairro, cidade: form.cidade, uf: form.uf, numero: form.numero }
    })
    auth.usuario.nome = form.nome
    localStorage.setItem('usuario', JSON.stringify(auth.usuario))
    sucesso.value = 'Perfil atualizado com sucesso!'
  } catch (err2) {
    erro.value = err2.response?.data?.message || 'Erro ao salvar'
  } finally {
    salvando.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/perfil')
    const u = data.usuario
    form.nome = u.nome || ''
    form.telefone = u.telefone || ''
    form.cep = u.endereco?.cep || ''
    form.logradouro = u.endereco?.logradouro || ''
    form.bairro = u.endereco?.bairro || ''
    form.cidade = u.endereco?.cidade || ''
    form.uf = u.endereco?.uf || ''
    form.numero = u.endereco?.numero || ''
  } catch {}
})
</script>

<style scoped>
h1 { font-size: 26px; }
.perfil-header { display: flex; align-items: center; gap: 18px; }
.avatar-grande {
  width: 56px; height: 56px; background: var(--verde); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 600; flex-shrink: 0;
}
.perfil-nome { font-size: 18px; font-family: var(--fonte-display); }
</style>

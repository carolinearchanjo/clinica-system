<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <div class="auth-logo">🏥</div>
        <h1>Criar Conta</h1>
        <p class="text-muted text-sm">Cadastro de paciente</p>
      </div>

      <form @submit.prevent="registrar" class="auth-form">
        <div class="form-group">
          <label class="form-label">Nome completo</label>
          <input v-model="form.nome" type="text" class="form-input" :class="{ error: erros.nome }" placeholder="Seu nome" />
          <span v-if="erros.nome" class="form-error">{{ erros.nome }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input v-model="form.email" type="email" class="form-input" :class="{ error: erros.email }" placeholder="seu@email.com" />
            <span v-if="erros.email" class="form-error">{{ erros.email }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input v-model="form.telefone" type="tel" class="form-input" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">CPF</label>
            <input v-model="form.cpf" type="text" class="form-input" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label class="form-label">CEP</label>
            <div class="input-suffix">
              <input v-model="form.cep" type="text" class="form-input" placeholder="00000-000"
                @blur="buscarCep" maxlength="9" />
              <span v-if="buscandoCep" class="spinner spinner-dark cep-spinner"></span>
            </div>
          </div>
        </div>

        <div v-if="form.logradouro" class="endereco-resumo text-sm">
          📍 {{ form.logradouro }}, {{ form.bairro }} — {{ form.cidade }}/{{ form.uf }}
        </div>

        <div class="form-group">
          <label class="form-label">Senha</label>
          <input v-model="form.senha" type="password" class="form-input" :class="{ error: erros.senha }" placeholder="Mínimo 6 caracteres" />
          <span v-if="erros.senha" class="form-error">{{ erros.senha }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Confirmar senha</label>
          <input v-model="form.confirmar" type="password" class="form-input" :class="{ error: erros.confirmar }" placeholder="Repita a senha" />
          <span v-if="erros.confirmar" class="form-error">{{ erros.confirmar }}</span>
        </div>

        <div v-if="erroGeral" class="alert alert-erro mt-1">⚠️ {{ erroGeral }}</div>

        <button type="submit" class="btn btn-primary btn-block mt-2" :disabled="auth.carregando">
          <span v-if="auth.carregando" class="spinner"></span>
          {{ auth.carregando ? 'Criando conta...' : 'Criar conta' }}
        </button>
      </form>

      <p class="auth-footer text-sm text-muted">
        Já tem conta? <RouterLink to="/login">Entrar</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import api from '@/services/api'

const auth = useAuthStore()
const router = useRouter()
const buscandoCep = ref(false)
const erroGeral = ref('')

const form = reactive({
  nome: '', email: '', telefone: '', cpf: '', cep: '',
  logradouro: '', bairro: '', cidade: '', uf: '',
  senha: '', confirmar: ''
})
const erros = reactive({ nome: '', email: '', senha: '', confirmar: '' })

const buscarCep = async () => {
  const cep = form.cep.replace(/\D/g, '')
  if (cep.length !== 8) return
  buscandoCep.value = true
  try {
    const { data } = await api.get(`/cep/${cep}`)
    if (data.success) {
      form.logradouro = data.endereco.logradouro
      form.bairro = data.endereco.bairro
      form.cidade = data.endereco.cidade
      form.uf = data.endereco.uf
    }
  } catch {} finally {
    buscandoCep.value = false
  }
}

const validar = () => {
  Object.keys(erros).forEach(k => erros[k] = '')
  let ok = true
  if (!form.nome.trim()) { erros.nome = 'Nome obrigatório'; ok = false }
  if (!form.email) { erros.email = 'E-mail obrigatório'; ok = false }
  if (form.senha.length < 6) { erros.senha = 'Mínimo 6 caracteres'; ok = false }
  if (form.senha !== form.confirmar) { erros.confirmar = 'Senhas não conferem'; ok = false }
  return ok
}

const registrar = async () => {
  if (!validar()) return
  erroGeral.value = ''
  try {
    await auth.cadastrar({
      nome: form.nome, email: form.email, senha: form.senha,
      telefone: form.telefone, cpf: form.cpf,
      endereco: { cep: form.cep, logradouro: form.logradouro, bairro: form.bairro, cidade: form.cidade, uf: form.uf }
    })
    router.push('/dashboard')
  } catch (err) {
    erroGeral.value = err.response?.data?.message || 'Erro ao cadastrar'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px; background: linear-gradient(135deg, var(--verde-pale) 0%, var(--creme) 100%);
}
.auth-card { width: 100%; max-width: 520px; }
.auth-header { text-align: center; margin-bottom: 24px; }
.auth-logo { font-size: 32px; margin-bottom: 6px; }
.auth-header h1 { font-size: 24px; color: var(--verde); }
.auth-form { display: flex; flex-direction: column; gap: 14px; }
.auth-footer { text-align: center; margin-top: 18px; }
.input-suffix { position: relative; }
.cep-spinner { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
.endereco-resumo {
  background: var(--verde-pale); padding: 8px 12px; border-radius: var(--radius-sm);
  color: var(--verde); border: 1px solid var(--verde-menta);
}
</style>

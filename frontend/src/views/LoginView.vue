<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <div class="auth-logo">🏥</div>
        <h1>ClinicaFácil</h1>
        <p class="text-muted text-sm">Acesse sua conta</p>
      </div>

      <form @submit.prevent="entrar" class="auth-form">
        <div class="form-group">
          <label class="form-label">E-mail</label>
          <input v-model="form.email" type="email" class="form-input" :class="{ error: erros.email }"
            placeholder="seu@email.com" autocomplete="email" />
          <span v-if="erros.email" class="form-error">{{ erros.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Senha</label>
          <input v-model="form.senha" type="password" class="form-input" :class="{ error: erros.senha }"
            placeholder="••••••••" autocomplete="current-password" />
          <span v-if="erros.senha" class="form-error">{{ erros.senha }}</span>
        </div>

        <div v-if="erroGeral" class="alert alert-erro mt-2">⚠️ {{ erroGeral }}</div>

        <button type="submit" class="btn btn-primary btn-block mt-3" :disabled="auth.carregando">
          <span v-if="auth.carregando" class="spinner"></span>
          <span>{{ auth.carregando ? 'Entrando...' : 'Entrar' }}</span>
        </button>
      </form>

      <p class="auth-footer text-sm text-muted">
        Não tem conta?
        <RouterLink to="/cadastro">Cadastre-se</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', senha: '' })
const erros = reactive({ email: '', senha: '' })
const erroGeral = ref('')

const validar = () => {
  erros.email = ''
  erros.senha = ''
  let ok = true
  if (!form.email) { erros.email = 'E-mail obrigatório'; ok = false }
  if (!form.senha) { erros.senha = 'Senha obrigatória'; ok = false }
  return ok
}

const entrar = async () => {
  if (!validar()) return
  erroGeral.value = ''
  try {
    await auth.login(form.email, form.senha)
    router.push('/dashboard')
  } catch (err) {
    erroGeral.value = err.response?.data?.message || 'Erro ao fazer login'
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, var(--verde-pale) 0%, var(--creme) 100%);
}
.auth-card { width: 100%; max-width: 400px; }
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-logo { font-size: 36px; margin-bottom: 8px; }
.auth-header h1 { font-size: 26px; color: var(--verde); }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.auth-footer { text-align: center; margin-top: 20px; }
</style>

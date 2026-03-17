<template>
  <div class="page-wrapper">
    <NavBar v-if="auth.autenticado" />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()
</script>

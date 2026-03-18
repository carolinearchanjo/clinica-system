import { defineStore } from "pinia";
import api from "@/services/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    usuario: JSON.parse(localStorage.getItem("usuario") || "null"),
    token: localStorage.getItem("token") || null,
    carregando: false,
    erro: null,
  }),

  getters: {
    autenticado: (state) => !!state.token,
    isAdmin: (state) => state.usuario?.perfil === "admin",
    isSecretario: (state) => state.usuario?.perfil === "secretario",
    podeGerenciar: (state) =>
      ["admin", "secretario"].includes(state.usuario?.perfil),
  },

  actions: {
    async login(email, senha) {
      this.carregando = true;
      this.erro = null;
      try {
        const { data } = await api.post("/auth/login", { email, senha });
        this.token = data.token;
        this.usuario = data.usuario;
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        return data;
      } catch (err) {
        this.erro = err.response?.data?.message || "Erro ao fazer login";
        throw err;
      } finally {
        this.carregando = false;
      }
    },

    async cadastrar(payload) {
      this.carregando = true;
      this.erro = null;
      try {
        const { data } = await api.post("/auth/cadastrar", payload);
        this.token = data.token;
        this.usuario = data.usuario;
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        return data;
      } catch (err) {
        this.erro = err.response?.data?.message || "Erro ao cadastrar";
        throw err;
      } finally {
        this.carregando = false;
      }
    },

    logout() {
      this.token = null;
      this.usuario = null;
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
    },
  },
});

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 10000,
});

// Injeta token JWT em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona ao login em caso de 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const rotasPublicas = ["/login", "/cadastro"];
      if (!rotasPublicas.includes(window.location.pathname)) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.replace("/login"); // replace em vez de href
      }
    }
    return Promise.reject(err);
  },
);

export default api;

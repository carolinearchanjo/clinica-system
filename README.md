# 🏥 ClinicaFácil — Sistema de Atendimento Inteligente

Sistema web para gerenciamento de consultas médicas, desenvolvido com **Vue.js** (frontend) e **Node.js + Express** (backend), com autenticação JWT, integração com APIs externas e painel administrativo.

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Vue.js 3, Vue Router 4, Pinia, Vite |
| Backend | Node.js, Express 4 |
| Banco de dados | MongoDB + Mongoose |
| Autenticação | JWT (jsonwebtoken) + bcryptjs |
| API de CEP | ViaCEP (https://viacep.com.br) |
| API de Clima | OpenWeatherMap (forecast) |
| Validação | express-validator |

---

## 📋 Funcionalidades

- ✅ **Cadastro e login** de usuários com perfis: `paciente`, `secretario`, `admin`
- ✅ **Agendamento de consultas** com verificação de disponibilidade por médico/data
- ✅ **Consulta de CEP** automática via ViaCEP no cadastro e agendamento
- ✅ **Previsão do tempo** no dia da consulta via OpenWeatherMap, com alerta de chuva
- ✅ **Painel administrativo** com filtros, atualização de status e gestão de usuários
- ✅ **Proteção de rotas** por perfil via middleware JWT

---

## 🗂️ Estrutura do Projeto

```
clinica-system/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negócio
│   │   ├── middleware/     # Autenticação JWT
│   │   ├── models/         # Schemas Mongoose
│   │   └── routes/         # Definição de rotas
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/         # CSS global
    │   ├── components/     # NavBar
    │   ├── router/         # Vue Router + guards
    │   ├── services/       # Axios configurado
    │   ├── store/          # Pinia (auth)
    │   └── views/          # Páginas da aplicação
    ├── index.html
    └── vite.config.js
```

---

## ⚙️ Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- MongoDB rodando localmente (ou URI do MongoDB Atlas)
- Chave gratuita do [OpenWeatherMap](https://openweathermap.org/api)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas configurações
npm install
npm run dev
# Servidor em http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App em http://localhost:5173
```

---

## 🌐 Variáveis de Ambiente (Backend)

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb://localhost:27017/clinica_db` |
| `JWT_SECRET` | Chave secreta JWT | `minha_chave_secreta` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` |
| `OPENWEATHER_API_KEY` | Chave da API OpenWeatherMap | `abc123...` |
| `OPENWEATHER_CITY` | Cidade para previsão do tempo | `São Paulo` |

---

## 🔌 Endpoints da API

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/cadastrar` | Registrar novo usuário |
| POST | `/api/auth/login` | Login e obtenção do token |
| GET | `/api/auth/perfil` | Dados do usuário logado 🔒 |
| PUT | `/api/auth/perfil` | Atualizar perfil 🔒 |

### Agendamentos
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/agendamentos` | Criar agendamento 🔒 |
| GET | `/api/agendamentos/meus` | Listar agendamentos do paciente 🔒 |
| GET | `/api/agendamentos/disponibilidade?medico=&data=` | Horários disponíveis 🔒 |
| PATCH | `/api/agendamentos/:id/cancelar` | Cancelar agendamento 🔒 |

### APIs Externas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/cep/:cep` | Buscar endereço pelo CEP 🔒 |
| GET | `/api/clima?data=YYYY-MM-DD` | Previsão do tempo 🔒 |

### Administração
| Método | Rota | Descrição | Perfil |
|---|---|---|---|
| GET | `/api/admin/dashboard` | Resumo geral | admin/secretário |
| GET | `/api/admin/agendamentos` | Listar todos com filtros | admin/secretário |
| PATCH | `/api/admin/agendamentos/:id/status` | Atualizar status | admin/secretário |
| GET | `/api/admin/usuarios` | Listar usuários | admin |
| PATCH | `/api/admin/usuarios/:id` | Alterar perfil/status | admin |

> 🔒 = Requer token JWT no header `Authorization: Bearer <token>`

---

## 🔐 Fluxo de Autenticação JWT

```
1. Cliente envia POST /api/auth/login com {email, senha}
2. Backend valida credenciais e retorna {token, usuario}
3. Cliente armazena token no localStorage
4. Cada requisição inclui: Authorization: Bearer <token>
5. Middleware verifica e decodifica o token
6. Rotas protegidas por perfil via middleware autorizar()
```

---

## 🚢 Deploy

### Backend — Railway / Render
1. Conectar repositório
2. Configurar variáveis de ambiente
3. Comando de start: `node src/server.js`

### Frontend — Vercel / Netlify
1. Build command: `npm run build`
2. Output directory: `dist`
3. Configurar variável `VITE_API_URL` com URL do backend

### MongoDB
- **Atlas** (recomendado): Criar cluster gratuito em [mongodb.com/atlas](https://mongodb.com/atlas)
- Configurar `MONGODB_URI` com a connection string do Atlas

---

## 👤 Usuário Inicial Admin

Após subir o sistema, crie o primeiro usuário via `/api/auth/cadastrar` e promova-o a admin diretamente no MongoDB:

```js
db.usuarios.updateOne({ email: "seu@email.com" }, { $set: { perfil: "admin" } })
```

---

## 📌 Observações

- A API do OpenWeatherMap gratuita oferece previsão em intervalos de 3h para os próximos 5 dias.
- O ViaCEP não requer autenticação.
- O sistema usa índice único `(medico, data, horario)` para garantir que não haja conflito de horários.

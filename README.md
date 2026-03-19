# 🏥 ClinicaFácil — Sistema de Atendimento Inteligente

Sistema web completo para gerenciamento de consultas médicas em clínicas de pequeno porte, com agendamento, gestão de médicos, controle de agenda e painel administrativo.

**Deploy:** [clinica-system-coral.vercel.app](https://clinica-system-coral.vercel.app)

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Vue.js 3, Vue Router 4, Pinia, Vite |
| Backend | Node.js, Express 4 |
| Banco de dados | MongoDB + Mongoose |
| Autenticação | JWT (jsonwebtoken) + bcryptjs |
| API de CEP | ViaCEP (https://viacep.com.br) |
| API de Clima | OpenWeatherMap (forecast) |
| Validação | express-validator |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## Funcionalidades

### Autenticação e Perfis
- Cadastro e login com perfis: `paciente`, `secretario`, `admin`
- Proteção de rotas por perfil via middleware JWT
- Edição de perfil com preenchimento automático de endereço por CEP

### Agendamento (Paciente)
- Calendário visual customizado mostrando dias com atendimento disponível por médico
- Seleção de especialidade, médico e horário com verificação de disponibilidade em tempo real
- Previsão do tempo no dia da consulta via OpenWeatherMap, com alerta de chuva baseado na cidade informada
- Cancelamento de consultas agendadas ou confirmadas
- Listagem de consultas com filtro por status

### Gestão de Médicos (Secretário/Admin)
- Cadastro, edição e desativação de médicos com CRM e especialidade
- Grade semanal de atendimento configurável por dia da semana e horários
- Visualização da agenda do médico por data com status de cada horário
- Bloqueio de horários específicos ou dia inteiro com motivo (imprevistos)
- Desbloqueio individual ou do dia inteiro

### Painel Administrativo (Secretário/Admin)
- Agendamento de consultas em nome de pacientes com busca por nome/e-mail
- Listagem de todos os agendamentos com filtros por status, data e médico
- Atualização de status dos agendamentos (agendado → confirmado → realizado)
- Impedimento de marcar como realizado antes do horário da consulta
- Consultas canceladas/realizadas não permitem alteração de status
- Cadastro, edição e exclusão de pacientes
- Cadastro e edição de secretários e admins (somente admin)

---

## Estrutura do Projeto

```
clinica-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin.controller.js
│   │   │   ├── agendamento.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── bloqueio.controller.js
│   │   │   ├── external.controller.js
│   │   │   └── medico.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── Agendamento.js
│   │   │   ├── BloqueioAgenda.js
│   │   │   ├── Medico.js
│   │   │   └── Usuario.js
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── agendamento.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── bloqueio.routes.js
│   │   │   ├── cep.routes.js
│   │   │   ├── clima.routes.js
│   │   │   └── medico.routes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/         # CSS global com design system
    │   ├── components/
    │   │   ├── CalendarioAgendamento.vue
    │   │   └── NavBar.vue
    │   ├── router/         # Vue Router + guards por perfil
    │   ├── services/       # Axios com interceptor JWT
    │   ├── store/          # Pinia (auth)
    │   └── views/
    │       ├── AdminView.vue
    │       ├── AgendamentosView.vue
    │       ├── CadastroView.vue
    │       ├── DashboardView.vue
    │       ├── LoginView.vue
    │       ├── NovoAgendamentoView.vue
    │       └── PerfilView.vue
    ├── index.html
    ├── vercel.json
    └── vite.config.js
```

---

## Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- MongoDB rodando localmente ou URI do [MongoDB Atlas](https://mongodb.com/atlas)
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

## Variáveis de Ambiente (Backend)

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/clinica_db` |
| `JWT_SECRET` | Chave secreta JWT | `string_longa_e_aleatoria` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` |
| `OPENWEATHER_API_KEY` | Chave da API OpenWeatherMap | `abc123...` |
| `OPENWEATHER_CITY` | Cidade padrão para previsão | `Rio de Janeiro` |
| `FRONTEND_URL` | URL do frontend em produção | `https://clinica-system-coral.vercel.app` |

### Variável de Ambiente (Frontend — Vercel)

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL base do backend | `https://seu-backend.up.railway.app/api` |

---

## Endpoints da API

### Autenticação
| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/auth/cadastrar` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/perfil` | Autenticado |
| PUT | `/api/auth/perfil` | Autenticado |

### Agendamentos
| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/agendamentos` | Autenticado |
| GET | `/api/agendamentos/meus` | Autenticado |
| GET | `/api/agendamentos/disponibilidade?medicoId=&data=` | Autenticado |
| PATCH | `/api/agendamentos/:id/cancelar` | Autenticado |

### Médicos
| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/medicos` | Autenticado |
| GET | `/api/medicos/especialidades` | Autenticado |
| GET | `/api/medicos/:id` | Autenticado |
| POST | `/api/medicos` | Secretário/Admin |
| PATCH | `/api/medicos/:id` | Secretário/Admin |
| DELETE | `/api/medicos/:id` | Secretário/Admin |

### Bloqueios de Agenda
| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/bloqueios?medicoId=&data=` | Secretário/Admin |
| GET | `/api/bloqueios/mes?medicoId=&inicio=&fim=` | Secretário/Admin |
| POST | `/api/bloqueios` | Secretário/Admin |
| DELETE | `/api/bloqueios/dia` | Secretário/Admin |
| DELETE | `/api/bloqueios/:id` | Secretário/Admin |

### APIs Externas
| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/cep/:cep` | Autenticado |
| GET | `/api/clima?data=YYYY-MM-DD&cidade=` | Autenticado |

### Administração
| Método | Rota | Acesso |
|---|---|---|
| GET | `/api/admin/dashboard` | Secretário/Admin |
| GET | `/api/admin/agendamentos` | Secretário/Admin |
| PATCH | `/api/admin/agendamentos/:id/status` | Secretário/Admin |
| GET | `/api/admin/agenda-medico?medicoId=&data=` | Secretário/Admin |
| GET | `/api/admin/pacientes` | Secretário/Admin |
| POST | `/api/admin/pacientes` | Secretário/Admin |
| PATCH | `/api/admin/pacientes/:id` | Secretário/Admin |
| DELETE | `/api/admin/pacientes/:id` | Secretário/Admin |
| GET | `/api/admin/usuarios` | Admin |
| POST | `/api/admin/usuarios` | Admin |
| PATCH | `/api/admin/usuarios/:id` | Admin |

---

## Fluxo de Autenticação JWT

```
1. Cliente envia POST /api/auth/login com {email, senha}
2. Backend valida credenciais e retorna {token, usuario}
3. Cliente armazena token no localStorage
4. Cada requisição inclui: Authorization: Bearer <token>
5. Middleware verifica e decodifica o token
6. Rotas protegidas por perfil via middleware autorizar()
7. Token expirado → redirect automático para /login
```

---

## Perfis de Acesso

| Perfil | Permissões |
|---|---|
| `paciente` | Cadastro, login, agendamento, cancelamento e visualização das próprias consultas |
| `secretario` | Tudo do paciente + gerenciar agenda de médicos, agendar para pacientes, cadastrar/editar pacientes e médicos, atualizar status de consultas |
| `admin` | Tudo do secretário + cadastrar/editar secretários e outros admins |

---

## Deploy

### Backend — Railway
1. Conectar repositório GitHub
2. Configurar **Root Directory** como `backend`
3. Adicionar variáveis de ambiente na aba **Variables**
4. Gerar domínio em **Settings → Networking → Generate Domain**

### Frontend — Vercel
1. Conectar repositório GitHub
2. Configurar **Root Directory** como `frontend`
3. Adicionar variável `VITE_API_URL` apontando para o backend do Railway
4. Deploy automático a cada push na branch `main`

### MongoDB — Atlas
1. Criar cluster gratuito em [mongodb.com/atlas](https://mongodb.com/atlas)
2. Criar usuário em **Database Access**
3. Liberar IPs em **Network Access → Allow Access from Anywhere**
4. Copiar URI de conexão e adicionar `/clinica_db` antes do `?`

---

## Primeiro Usuário Admin

Crie uma conta normalmente pelo site e promova-a a admin diretamente no Atlas:

1. Atlas → **Browse Collections** → banco `clinica_db` → coleção `usuarios`
2. Encontre o documento do seu usuário → clique em **Edit**
3. Mude `perfil` de `"paciente"` para `"admin"` → **Update**

---

## Observações Técnicas

- A API do OpenWeatherMap gratuita oferece previsão em intervalos de 3h para os próximos 5 dias. Datas além desse período não exibem previsão climática.
- O model `Agendamento` usa índice único `(medico, data, horario)` para garantir que não haja conflito de horários no banco.
- Médicos com agendamentos futuros confirmados não podem ser excluídos — apenas desativados.
- Consultas nos status `cancelado` ou `realizado` são imutáveis.
- Não é possível marcar uma consulta como `realizado` antes do horário agendado.

---

## Acesso para Avaliação

O banco de dados já está populado com dados de demonstração. Use os seguintes acessos para testar o sistema:

| Perfil | E-mail | Senha |
|---|---|---|
| **Admin** | admin@clinicafacil.com | Admin@123 |
| **Secretária** | secretaria@clinicafacil.com | Secr@123 |
| **Paciente** | joao.silva@email.com | Paciente@123 |

O sistema conta com **10 médicos** de diferentes especialidades, **15 agendamentos** distribuídos entre passados (realizados/cancelados) e futuros (agendados/confirmados), e **5 pacientes** cadastrados.

---

## Resetar Dados de Demonstração

Para repovoar o banco do zero a qualquer momento:

```bash
cd backend
node src/seed.js
```

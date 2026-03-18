require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const agendamentoRoutes = require("./routes/agendamento.routes");
const adminRoutes = require("./routes/admin.routes");
const cepRoutes = require("./routes/cep.routes");
const climaRoutes = require("./routes/clima.routes");
const medicoRoutes = require("./routes/medico.routes");
const bloqueioRoutes = require("./routes/bloqueio.routes");

const app = express();

// Rate limiting
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas requisições. Tente novamente em 15 minutos.",
  },
});

const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});

app.use("/api", limiterGeral);
app.use("/api/auth/login", limiterLogin);

// CORS
const origensPermitidas = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origensPermitidas.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("dev"));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cep", cepRoutes);
app.use("/api/clima", climaRoutes);
app.use("/api/medicos", medicoRoutes);
app.use("/api/bloqueios", bloqueioRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Erro interno do servidor",
  });
});

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB conectado");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Erro ao conectar MongoDB:", err.message);
    process.exit(1);
  });

module.exports = app;

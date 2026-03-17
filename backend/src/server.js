require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const agendamentoRoutes = require('./routes/agendamento.routes');
const adminRoutes = require('./routes/admin.routes');
const cepRoutes = require('./routes/cep.routes');
const climaRoutes = require('./routes/clima.routes');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/clima', climaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
});

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;

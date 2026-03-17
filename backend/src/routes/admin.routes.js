const express = require('express');
const {
  listarAgendamentos,
  atualizarStatusAgendamento,
  listarUsuarios,
  alterarPerfilUsuario,
  dashboard
} = require('../controllers/admin.controller');
const { autenticar, autorizar } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(autenticar, autorizar('admin', 'secretario'));

router.get('/dashboard', dashboard);
router.get('/agendamentos', listarAgendamentos);
router.patch('/agendamentos/:id/status', autorizar('admin', 'secretario'), atualizarStatusAgendamento);
router.get('/usuarios', autorizar('admin'), listarUsuarios);
router.patch('/usuarios/:id', autorizar('admin'), alterarPerfilUsuario);

module.exports = router;

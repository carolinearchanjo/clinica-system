const express = require('express');
const {
  listarAgendamentos, atualizarStatusAgendamento, agendaMedico,
  listarUsuarios, cadastrarUsuario, atualizarDadosUsuario, excluirUsuario,
  listarPacientes, dashboard
} = require('../controllers/admin.controller');
const { autenticar, autorizar } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(autenticar, autorizar('admin', 'secretario'));

router.get('/dashboard', dashboard);
router.get('/agendamentos', listarAgendamentos);
router.patch('/agendamentos/:id/status', atualizarStatusAgendamento);
router.get('/agenda-medico', agendaMedico);
router.get('/pacientes', listarPacientes);
router.post('/pacientes', cadastrarUsuario);
router.patch('/pacientes/:id', atualizarDadosUsuario);
router.delete('/pacientes/:id', excluirUsuario);
router.get('/usuarios', autorizar('admin'), listarUsuarios);
router.post('/usuarios', autorizar('admin'), cadastrarUsuario);
router.patch('/usuarios/:id', autorizar('admin'), atualizarDadosUsuario);

module.exports = router;
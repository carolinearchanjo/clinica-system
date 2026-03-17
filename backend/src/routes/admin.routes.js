const express = require('express');
const {
  listarAgendamentos, atualizarStatusAgendamento,
  listarUsuarios, cadastrarUsuario, atualizarDadosUsuario, excluirUsuario,
  listarPacientes, dashboard
} = require('../controllers/admin.controller');
const { autenticar, autorizar } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(autenticar, autorizar('admin', 'secretario'));

router.get('/dashboard', dashboard);

// Agendamentos — secretário e admin
router.get('/agendamentos', listarAgendamentos);
router.patch('/agendamentos/:id/status', atualizarStatusAgendamento);

// Pacientes — secretário e admin
router.get('/pacientes', listarPacientes);
router.post('/pacientes', cadastrarUsuario); // reutiliza, perfil vem no body
router.patch('/pacientes/:id', atualizarDadosUsuario);
router.delete('/pacientes/:id', excluirUsuario);

// Usuários (secretários/admins) — somente admin
router.get('/usuarios', autorizar('admin'), listarUsuarios);
router.post('/usuarios', autorizar('admin'), cadastrarUsuario);
router.patch('/usuarios/:id', autorizar('admin'), atualizarDadosUsuario);

module.exports = router;
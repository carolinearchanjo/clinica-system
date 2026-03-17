const express = require('express');
const {
  criarAgendamento,
  meuAgendamentos,
  cancelarAgendamento,
  verificarDisponibilidade
} = require('../controllers/agendamento.controller');
const { autenticar } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(autenticar);

router.get('/disponibilidade', verificarDisponibilidade);
router.get('/meus', meuAgendamentos);
router.post('/', criarAgendamento);
router.patch('/:id/cancelar', cancelarAgendamento);

module.exports = router;

// routes/auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const { cadastrar, login, perfil, atualizarPerfil } = require('../controllers/auth.controller');
const { autenticar } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/cadastrar', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
], cadastrar);

router.post('/login', [
  body('email').isEmail().withMessage('E-mail inválido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], login);

router.get('/perfil', autenticar, perfil);
router.put('/perfil', autenticar, atualizarPerfil);

module.exports = router;

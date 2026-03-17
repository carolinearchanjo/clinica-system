const express = require('express');
const { buscarCep } = require('../controllers/external.controller');
const { autenticar } = require('../middleware/auth.middleware');

const router = express.Router();
router.get('/:cep', autenticar, buscarCep);

module.exports = router;

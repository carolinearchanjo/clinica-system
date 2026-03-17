const express = require('express');
const { buscarClima } = require('../controllers/external.controller');
const { autenticar } = require('../middleware/auth.middleware');

const router = express.Router();
router.get('/', autenticar, buscarClima);

module.exports = router;

const express = require('express');
const { listar, criar, atualizar, excluir, listarEspecialidades, buscarPorId } = require('../controllers/medico.controller');
const { autenticar, autorizar } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', autenticar, listar);
router.get('/especialidades', autenticar, listarEspecialidades);
router.get('/:id', autenticar, buscarPorId);

router.post('/', autenticar, autorizar('admin', 'secretario'), criar);
router.patch('/:id', autenticar, autorizar('admin', 'secretario'), atualizar);
router.delete('/:id', autenticar, autorizar('admin', 'secretario'), excluir);

module.exports = router;
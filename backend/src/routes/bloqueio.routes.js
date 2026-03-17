const express = require('express');
const { listarBloqueios, criarBloqueio, removerBloqueio, removerBloqueiosDoDia, bloqueiosMes } = require('../controllers/bloqueio.controller');
const { autenticar, autorizar } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(autenticar, autorizar('admin', 'secretario'));

router.get('/mes', bloqueiosMes);
router.get('/', listarBloqueios);
router.post('/', criarBloqueio);
router.delete('/dia', removerBloqueiosDoDia);
router.delete('/:id', removerBloqueio);

module.exports = router;
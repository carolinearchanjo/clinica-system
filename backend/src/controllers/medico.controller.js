const Medico = require('../models/Medico');
const Agendamento = require('../models/Agendamento');

const listar = async (req, res) => {
  try {
    const { especialidade, busca, ativo } = req.query;
    const filtro = {};
    if (especialidade) filtro.especialidade = especialidade;
    if (ativo !== undefined) filtro.ativo = ativo === 'true';
    if (busca) filtro.$or = [
      { nome: new RegExp(busca, 'i') },
      { crm: new RegExp(busca, 'i') }
    ];
    const medicos = await Medico.find(filtro).sort({ especialidade: 1, nome: 1 });
    res.json({ success: true, medicos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const criar = async (req, res) => {
  try {
    const { nome, especialidade, crm, telefone, email } = req.body;
    if (!nome || !especialidade || !crm) {
      return res.status(400).json({ success: false, message: 'Nome, especialidade e CRM são obrigatórios' });
    }
    const existe = await Medico.findOne({ crm });
    if (existe) return res.status(409).json({ success: false, message: 'CRM já cadastrado' });
    const medico = await Medico.create({ nome, especialidade, crm, telefone, email });
    res.status(201).json({ success: true, medico });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const atualizar = async (req, res) => {
  try {
    const { nome, especialidade, crm, telefone, email, ativo, horariosSemana } = req.body;
    const medico = await Medico.findByIdAndUpdate(
      req.params.id,
      { nome, especialidade, crm, telefone, email, ativo, horariosSemana },
      { new: true, runValidators: true }
    );
    if (!medico) return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    res.json({ success: true, medico });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const excluir = async (req, res) => {
  try {
    const temAgendamentos = await Agendamento.exists({
      medico: req.params.id,
      status: { $in: ['agendado', 'confirmado'] }
    });
    if (temAgendamentos) {
      return res.status(409).json({
        success: false,
        message: 'Médico possui agendamentos futuros. Desative-o em vez de excluir.'
      });
    }
    await Medico.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Médico excluído' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listarEspecialidades = async (req, res) => {
  try {
    const especialidades = await Medico.distinct('especialidade', { ativo: true });
    res.json({ success: true, especialidades: especialidades.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const buscarPorId = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id)
    if (!medico) return res.status(404).json({ success: false, message: 'Médico não encontrado' })
    res.json({ success: true, medico })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}


module.exports = { listar, criar, atualizar, excluir, listarEspecialidades, buscarPorId };
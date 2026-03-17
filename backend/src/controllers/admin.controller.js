const Agendamento = require('../models/Agendamento');
const Usuario = require('../models/Usuario');

const listarAgendamentos = async (req, res) => {
  try {
    const { status, data, medico, page = 1, limit = 20 } = req.query;
    const filtro = {};

    if (status) filtro.status = status;
    if (medico) filtro.medico = new RegExp(medico, 'i');
    if (data) filtro.data = new Date(data);

    const total = await Agendamento.countDocuments(filtro);
    const agendamentos = await Agendamento.find(filtro)
      .populate('paciente', 'nome email telefone cpf')
      .sort({ data: -1, horario: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      pagina: Number(page),
      paginas: Math.ceil(total / limit),
      agendamentos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const atualizarStatusAgendamento = async (req, res) => {
  try {
    const { status } = req.body;
    const statusValidos = ['agendado', 'confirmado', 'cancelado', 'realizado'];

    if (!statusValidos.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status inválido' });
    }

    const agendamento = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('paciente', 'nome email');

    if (!agendamento) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    res.json({ success: true, agendamento });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { perfil, page = 1, limit = 20 } = req.query;
    const filtro = {};
    if (perfil) filtro.perfil = perfil;

    const total = await Usuario.countDocuments(filtro);
    const usuarios = await Usuario.find(filtro)
      .select('-senha')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, usuarios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const alterarPerfilUsuario = async (req, res) => {
  try {
    const { perfil, ativo } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { perfil, ativo },
      { new: true }
    ).select('-senha');

    if (!usuario) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    res.json({ success: true, usuario });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const dashboard = async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const [
      totalAgendamentos,
      agendamentosHoje,
      agendamentosPendentes,
      totalPacientes,
      agendamentosUltimos7Dias
    ] = await Promise.all([
      Agendamento.countDocuments(),
      Agendamento.countDocuments({ data: { $gte: hoje, $lt: amanha } }),
      Agendamento.countDocuments({ status: 'agendado' }),
      Usuario.countDocuments({ perfil: 'paciente' }),
      Agendamento.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      dashboard: {
        totalAgendamentos,
        agendamentosHoje,
        agendamentosPendentes,
        totalPacientes,
        agendamentosUltimos7Dias
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listarAgendamentos,
  atualizarStatusAgendamento,
  listarUsuarios,
  alterarPerfilUsuario,
  dashboard
};

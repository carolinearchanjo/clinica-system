const Agendamento = require('../models/Agendamento');
const Usuario = require('../models/Usuario');
const Medico = require('../models/Medico');
const BloqueioAgenda = require('../models/BloqueioAgenda');

const STATUS_FINAIS = ['cancelado', 'realizado'];

const listarAgendamentos = async (req, res) => {
  try {
    const { status, data, medicoId, page = 1, limit = 15 } = req.query;
    const filtro = {};
    if (status) filtro.status = status;
    if (medicoId) filtro.medico = medicoId;
    if (data) filtro.data = new Date(data);

    const total = await Agendamento.countDocuments(filtro);
    const agendamentos = await Agendamento.find(filtro)
      .populate('paciente', 'nome email telefone cpf')
      .populate('medico', 'nome especialidade crm')   // <-- essa linha
      .sort({ data: -1, horario: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, pagina: Number(page), paginas: Math.ceil(total / limit), agendamentos });
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

    const agendamento = await Agendamento.findById(req.params.id);
    if (!agendamento) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    if (STATUS_FINAIS.includes(agendamento.status)) {
      return res.status(400).json({
        success: false,
        message: `Agendamento já está ${agendamento.status} e não pode ser alterado`
      });
    }

    // Impede marcar como realizado se ainda não chegou o horário
    if (status === 'realizado') {
      const [hora, minuto] = agendamento.horario.split(':').map(Number);
      const dataHoraConsulta = new Date(agendamento.data);
      dataHoraConsulta.setUTCHours(hora, minuto, 0, 0);

      if (dataHoraConsulta > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível marcar como realizado antes do horário da consulta'
        });
      }
    }

    agendamento.status = status;
    await agendamento.save();
    await agendamento.populate([
      { path: 'paciente', select: 'nome email' },
      { path: 'medico', select: 'nome especialidade' }
    ]);

    res.json({ success: true, agendamento });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const agendaMedico = async (req, res) => {
  try {
    const { medicoId, data } = req.query;
    if (!medicoId || !data) {
      return res.status(400).json({ success: false, message: 'Médico e data são obrigatórios' });
    }

    const medico = await Medico.findById(medicoId);
    if (!medico) return res.status(404).json({ success: false, message: 'Médico não encontrado' });

    const nomes = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const nomeDia = nomes[new Date(data).getUTCDay()];
    const configuracao = medico.horariosSemana?.find(h => h.dia === nomeDia);
    const horariosPossiveis = configuracao?.ativo ? (configuracao.horarios || []).sort() : [];

    if (!horariosPossiveis.length) {
      return res.json({ success: true, medico, data, grade: [], semAtendimento: true, dia: nomeDia });
    }

    // Busca agendamentos e bloqueios em paralelo
    const [agendamentos, bloqueios] = await Promise.all([
      Agendamento.find({
        medico: medicoId,
        data: new Date(data),
        status: { $ne: 'cancelado' }
      }).populate('paciente', 'nome email telefone').select('horario status paciente observacoes'),
      BloqueioAgenda.find({
        medico: medicoId,
        data: new Date(data)
      }).select('horario motivo _id')
    ]);

    // Verifica bloqueio de dia inteiro
    const bloqueioDia = bloqueios.find(b => b.horario === null);

    const porHorario = {};
    agendamentos.forEach(ag => { porHorario[ag.horario] = ag; });

    const bloqueiosPorHorario = {};
    bloqueios.filter(b => b.horario !== null).forEach(b => { bloqueiosPorHorario[b.horario] = b; });

    const grade = horariosPossiveis.map(h => {
      if (bloqueioDia) {
        return { horario: h, livre: false, bloqueado: true, bloqueioId: bloqueioDia._id, motivo: bloqueioDia.motivo, agendamento: null }
      }
      if (bloqueiosPorHorario[h]) {
        return { horario: h, livre: false, bloqueado: true, bloqueioId: bloqueiosPorHorario[h]._id, motivo: bloqueiosPorHorario[h].motivo, agendamento: null }
      }
      if (porHorario[h]) {
        return { horario: h, livre: false, bloqueado: false, agendamento: porHorario[h] }
      }
      return { horario: h, livre: true, bloqueado: false, agendamento: null }
    });

    res.json({ success: true, medico, data, grade, bloqueioDia: bloqueioDia || null, dia: nomeDia });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { perfil, busca, page = 1, limit = 20 } = req.query;
    const filtro = {};
    if (perfil) filtro.perfil = perfil;
    if (busca) filtro.$or = [
      { nome: new RegExp(busca, 'i') },
      { email: new RegExp(busca, 'i') },
      { cpf: new RegExp(busca, 'i') }
    ];
    const total = await Usuario.countDocuments(filtro);
    const usuarios = await Usuario.find(filtro)
      .select('-senha')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, paginas: Math.ceil(total / limit), usuarios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cadastrarUsuario = async (req, res) => {
  try {
    const { nome, email, senha, perfil, telefone, cpf } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });
    const usuario = await Usuario.create({ nome, email, senha, perfil, telefone, cpf });
    res.status(201).json({
      success: true,
      usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const atualizarDadosUsuario = async (req, res) => {
  try {
    const { nome, email, telefone, cpf, perfil, ativo, endereco } = req.body;
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nome, email, telefone, cpf, perfil, ativo, endereco },
      { new: true, runValidators: true }
    ).select('-senha');
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, usuario });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const excluirUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    if (['admin', 'secretario'].includes(usuario.perfil)) {
      return res.status(403).json({ success: false, message: 'Não é possível excluir usuários do sistema por aqui' });
    }
    await Agendamento.updateMany(
      { paciente: req.params.id, status: { $in: ['agendado', 'confirmado'] } },
      { status: 'cancelado' }
    );
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Paciente excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listarPacientes = async (req, res) => {
  try {
    const { busca } = req.query;
    const filtro = { perfil: 'paciente', ativo: true };
    if (busca) filtro.$or = [
      { nome: new RegExp(busca, 'i') },
      { email: new RegExp(busca, 'i') }
    ];
    const pacientes = await Usuario.find(filtro).select('_id nome email telefone').limit(30);
    res.json({ success: true, pacientes });
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

    const [totalAgendamentos, agendamentosHoje, agendamentosPendentes, totalPacientes, agendamentosUltimos7Dias] =
      await Promise.all([
        Agendamento.countDocuments(),
        Agendamento.countDocuments({ data: { $gte: hoje, $lt: amanha } }),
        Agendamento.countDocuments({ status: 'agendado' }),
        Usuario.countDocuments({ perfil: 'paciente' }),
        Agendamento.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ])
      ]);

    res.json({ success: true, dashboard: { totalAgendamentos, agendamentosHoje, agendamentosPendentes, totalPacientes, agendamentosUltimos7Dias } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listarAgendamentos, atualizarStatusAgendamento, agendaMedico,
  listarUsuarios, cadastrarUsuario, atualizarDadosUsuario, excluirUsuario,
  listarPacientes, dashboard
};
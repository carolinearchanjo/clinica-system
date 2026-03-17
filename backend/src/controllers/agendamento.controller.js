const axios = require('axios');
const Agendamento = require('../models/Agendamento');
const Medico = require('../models/Medico');

const buscarPrevisaoClima = async (data, cidade) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const cidadeBusca = cidade || process.env.OPENWEATHER_CITY || 'São Paulo';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidadeBusca)}&appid=${apiKey}&units=metric&lang=pt_br`;
    const resp = await axios.get(url, { timeout: 5000 });
    const dataAlvo = new Date(data).toISOString().split('T')[0];
    const previsao = resp.data.list.find(item => item.dt_txt.startsWith(dataAlvo));
    if (!previsao) return null;
    const temChuva = previsao.weather.some(w => ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main));
    return {
      descricao: previsao.weather[0].description,
      temperatura: Math.round(previsao.main.temp),
      chuva: temChuva,
      icone: previsao.weather[0].icon
    };
  } catch { return null; }
};

const horariosDoDia = (medico, data) => {
  const diaSemana = new Date(data).getUTCDay(); // 0=domingo, 6=sabado
  const nomes = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const nomeDia = nomes[diaSemana];
  const configuracao = medico.horariosSemana?.find(h => h.dia === nomeDia);
  if (!configuracao || !configuracao.ativo || !configuracao.horarios?.length) return [];
  return configuracao.horarios.sort();
};

const criarAgendamento = async (req, res) => {
  try {
    const { pacienteId, medicoId, data, horario, observacoes, enderecoConsulta } = req.body;

    const medico = await Medico.findById(medicoId);
    if (!medico || !medico.ativo) {
      return res.status(404).json({ success: false, message: 'Médico não encontrado ou inativo' });
    }

    // Valida se o horário pertence à grade do médico naquele dia
    const horariosValidos = horariosDoDia(medico, data);
    if (horariosValidos.length && !horariosValidos.includes(horario)) {
      return res.status(400).json({ success: false, message: 'Horário fora da grade de atendimento do médico' });
    }

    const conflito = await Agendamento.findOne({
      medico: medicoId, data, horario, status: { $ne: 'cancelado' }
    });
    if (conflito) {
      return res.status(409).json({ success: false, message: 'Horário indisponível para este médico' });
    }

    const cidade = enderecoConsulta?.cidade || null;
    const previsaoClimatica = await buscarPrevisaoClima(data, cidade);
    const paciente = pacienteId || req.usuario._id;

    const agendamento = await Agendamento.create({
      paciente, medico: medicoId, data, horario, observacoes, enderecoConsulta, previsaoClimatica
    });

    await agendamento.populate([
      { path: 'paciente', select: 'nome email telefone' },
      { path: 'medico', select: 'nome especialidade crm' }
    ]);

    res.status(201).json({ success: true, agendamento });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Horário já ocupado para este médico' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const meuAgendamentos = async (req, res) => {
  try {
    const agendamentos = await Agendamento.find({ paciente: req.usuario._id })
      .sort({ data: 1, horario: 1 })
      .populate('paciente', 'nome email')
      .populate('medico', 'nome especialidade crm');
    res.json({ success: true, agendamentos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const cancelarAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findOne({
      _id: req.params.id,
      paciente: req.usuario._id
    });
    if (!agendamento) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }
    if (agendamento.status === 'cancelado') {
      return res.status(400).json({ success: false, message: 'Agendamento já cancelado' });
    }
    agendamento.status = 'cancelado';
    await agendamento.save();
    res.json({ success: true, message: 'Agendamento cancelado', agendamento });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const verificarDisponibilidade = async (req, res) => {
  try {
    const { medicoId, data } = req.query;

    const medico = await Medico.findById(medicoId);
    if (!medico || !medico.ativo) {
      return res.status(404).json({ success: false, message: 'Médico não encontrado' });
    }

    const horariosPossiveis = horariosDoDia(medico, data);
    if (!horariosPossiveis.length) {
      return res.json({ success: true, horariosDisponiveis: [], horariosOcupados: [], semAtendimento: true });
    }

    const agendamentos = await Agendamento.find({
      medico: medicoId,
      data: new Date(data),
      status: { $ne: 'cancelado' }
    }).select('horario');

    const horariosOcupados = agendamentos.map(a => a.horario);
    const horariosDisponiveis = horariosPossiveis.filter(h => !horariosOcupados.includes(h));

    res.json({ success: true, horariosDisponiveis, horariosOcupados });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { criarAgendamento, meuAgendamentos, cancelarAgendamento, verificarDisponibilidade };
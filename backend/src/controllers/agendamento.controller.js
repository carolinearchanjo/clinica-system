const axios = require('axios');
const Agendamento = require('../models/Agendamento');

const buscarPrevisaoClima = async (data) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const cidade = process.env.OPENWEATHER_CITY || 'São Paulo';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    const resp = await axios.get(url, { timeout: 5000 });
    const dataAlvo = new Date(data).toISOString().split('T')[0];

    const previsao = resp.data.list.find((item) => {
      return item.dt_txt.startsWith(dataAlvo);
    });

    if (!previsao) return null;

    const temChuva = previsao.weather.some((w) =>
      ['Rain', 'Drizzle', 'Thunderstorm'].includes(w.main)
    );

    return {
      descricao: previsao.weather[0].description,
      temperatura: Math.round(previsao.main.temp),
      chuva: temChuva,
      icone: previsao.weather[0].icon
    };
  } catch {
    return null;
  }
};

const criarAgendamento = async (req, res) => {
  try {
    const { medico, especialidade, data, horario, observacoes, enderecoConsulta } = req.body;

    // Verificar disponibilidade
    const conflito = await Agendamento.findOne({ medico, data, horario, status: { $ne: 'cancelado' } });
    if (conflito) {
      return res.status(409).json({
        success: false,
        message: 'Horário indisponível para este médico'
      });
    }

    // Buscar previsão do tempo
    const previsaoClimatica = await buscarPrevisaoClima(data);

    const agendamento = await Agendamento.create({
      paciente: req.usuario._id,
      medico,
      especialidade,
      data,
      horario,
      observacoes,
      enderecoConsulta,
      previsaoClimatica
    });

    await agendamento.populate('paciente', 'nome email telefone');

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
      .populate('paciente', 'nome email');
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
    const { medico, data } = req.query;

    const horariosPossiveis = [
      '08:00','08:30','09:00','09:30','10:00','10:30',
      '11:00','11:30','13:00','13:30','14:00','14:30',
      '15:00','15:30','16:00','16:30','17:00','17:30'
    ];

    const agendamentos = await Agendamento.find({
      medico,
      data: new Date(data),
      status: { $ne: 'cancelado' }
    }).select('horario');

    const horariosOcupados = agendamentos.map((a) => a.horario);
    const horariosDisponiveis = horariosPossiveis.filter((h) => !horariosOcupados.includes(h));

    res.json({ success: true, horariosDisponiveis, horariosOcupados });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  criarAgendamento,
  meuAgendamentos,
  cancelarAgendamento,
  verificarDisponibilidade
};

const BloqueioAgenda = require('../models/BloqueioAgenda');
const Agendamento = require('../models/Agendamento');

const listarBloqueios = async (req, res) => {
  try {
    const { medicoId, data } = req.query;
    if (!medicoId || !data) {
      return res.status(400).json({ success: false, message: 'medicoId e data são obrigatórios' });
    }
    const bloqueios = await BloqueioAgenda.find({
      medico: medicoId,
      data: new Date(data)
    });
    res.json({ success: true, bloqueios });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const criarBloqueio = async (req, res) => {
  try {
    const { medicoId, data, horario, motivo } = req.body;
    if (!medicoId || !data) {
      return res.status(400).json({ success: false, message: 'medicoId e data são obrigatórios' });
    }

    // Se horario=null, bloqueia dia inteiro — verifica se já tem agendamentos
    if (!horario) {
      const temAgendamento = await Agendamento.exists({
        medico: medicoId,
        data: new Date(data),
        status: { $in: ['agendado', 'confirmado'] }
      });
      if (temAgendamento) {
        return res.status(409).json({
          success: false,
          message: 'Existem agendamentos confirmados neste dia. Cancele-os antes de bloquear.'
        });
      }
    } else {
      // Verifica se horário específico tem agendamento
      const temAgendamento = await Agendamento.exists({
        medico: medicoId,
        data: new Date(data),
        horario,
        status: { $in: ['agendado', 'confirmado'] }
      });
      if (temAgendamento) {
        return res.status(409).json({
          success: false,
          message: 'Este horário já possui um agendamento confirmado. Cancele-o antes de bloquear.'
        });
      }
    }

    const bloqueio = await BloqueioAgenda.create({
      medico: medicoId,
      data: new Date(data),
      horario: horario || null,
      motivo: motivo || ''
    });

    res.status(201).json({ success: true, bloqueio });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Este horário já está bloqueado' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const removerBloqueio = async (req, res) => {
  try {
    const bloqueio = await BloqueioAgenda.findByIdAndDelete(req.params.id);
    if (!bloqueio) {
      return res.status(404).json({ success: false, message: 'Bloqueio não encontrado' });
    }
    res.json({ success: true, message: 'Bloqueio removido' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removerBloqueiosDoDia = async (req, res) => {
  try {
    const { medicoId, data } = req.body;
    await BloqueioAgenda.deleteMany({ medico: medicoId, data: new Date(data) });
    res.json({ success: true, message: 'Bloqueios do dia removidos' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listarBloqueios, criarBloqueio, removerBloqueio, removerBloqueiosDoDia };
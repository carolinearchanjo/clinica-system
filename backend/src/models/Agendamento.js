const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Paciente é obrigatório']
    },
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medico',
      required: [true, 'Médico é obrigatório']
    },
    data: {
      type: Date,
      required: [true, 'Data é obrigatória']
    },
    horario: {
      type: String,
      required: [true, 'Horário é obrigatório'],
      match: [/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:MM)']
    },
    status: {
      type: String,
      enum: ['agendado', 'confirmado', 'cancelado', 'realizado'],
      default: 'agendado'
    },
    observacoes: {
      type: String,
      trim: true
    },
    previsaoClimatica: {
      descricao: String,
      temperatura: Number,
      chuva: Boolean,
      icone: String
    },
    enderecoConsulta: {
      cep: String,
      logradouro: String,
      bairro: String,
      cidade: String,
      uf: String
    }
  },
  { timestamps: true }
);

// Índice único por médico + data + horário
agendamentoSchema.index({ medico: 1, data: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('Agendamento', agendamentoSchema);
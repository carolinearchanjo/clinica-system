const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema(
  {
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'Paciente é obrigatório']
    },
    medico: {
      type: String,
      required: [true, 'Médico é obrigatório'],
      trim: true
    },
    especialidade: {
      type: String,
      required: [true, 'Especialidade é obrigatória'],
      trim: true
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

// Índice para evitar conflito de horário por médico
agendamentoSchema.index({ medico: 1, data: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('Agendamento', agendamentoSchema);

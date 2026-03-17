const mongoose = require('mongoose');

const bloqueioSchema = new mongoose.Schema(
  {
    medico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medico',
      required: true
    },
    data: {
      type: Date,
      required: true
    },
    horario: {
      type: String,
      match: /^\d{2}:\d{2}$/,
      default: null // null = dia inteiro bloqueado
    },
    motivo: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

// Índice único: mesmo médico não pode ter dois bloqueios no mesmo dia+horário
bloqueioSchema.index({ medico: 1, data: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('BloqueioAgenda', bloqueioSchema);
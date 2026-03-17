const mongoose = require('mongoose');

const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const horariosDiaSchema = new mongoose.Schema({
  dia: { type: String, enum: diasSemana, required: true },
  ativo: { type: Boolean, default: false },
  horarios: [{ type: String, match: /^\d{2}:\d{2}$/ }]
}, { _id: false });

const medicoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: [true, 'Nome é obrigatório'], trim: true },
    especialidade: { type: String, required: [true, 'Especialidade é obrigatória'], trim: true },
    crm: { type: String, required: [true, 'CRM é obrigatório'], trim: true, unique: true },
    telefone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    ativo: { type: Boolean, default: true },
    horariosSemana: {
      type: [horariosDiaSchema],
      default: () => diasSemana.map(dia => ({ dia, ativo: false, horarios: [] }))
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medico', medicoSchema);
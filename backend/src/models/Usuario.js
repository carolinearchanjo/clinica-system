const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'E-mail é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true
    },
    senha: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
      select: false
    },
    perfil: {
      type: String,
      enum: ['paciente', 'secretario', 'admin'],
      default: 'paciente'
    },
    telefone: {
      type: String,
      trim: true
    },
    cpf: {
      type: String,
      trim: true
    },
    endereco: {
      cep: String,
      logradouro: String,
      bairro: String,
      cidade: String,
      uf: String,
      complemento: String,
      numero: String
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Hash da senha antes de salvar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 12);
  next();
});

// Método para comparar senhas
usuarioSchema.methods.compararSenha = async function (senhaInformada) {
  return bcrypt.compare(senhaInformada, this.senha);
};

module.exports = mongoose.model('Usuario', usuarioSchema);

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');

const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const cadastrar = async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ success: false, erros: erros.array() });
  }

  try {
    const { nome, email, senha, telefone, cpf, perfil } = req.body;

    const emailExiste = await Usuario.findOne({ email });
    if (emailExiste) {
      return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });
    }

    // Apenas admins podem criar secretários
    const perfilFinal = perfil === 'secretario' ? 'paciente' : (perfil || 'paciente');

    const usuario = await Usuario.create({
      nome, email, senha, telefone, cpf, perfil: perfilFinal
    });

    const token = gerarToken(usuario._id);

    res.status(201).json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return res.status(400).json({ success: false, erros: erros.array() });
  }

  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email }).select('+senha');
    if (!usuario || !(await usuario.compararSenha(senha))) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos' });
    }

    if (!usuario.ativo) {
      return res.status(403).json({ success: false, message: 'Conta desativada' });
    }

    const token = gerarToken(usuario._id);

    res.json({
      success: true,
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const perfil = async (req, res) => {
  res.json({
    success: true,
    usuario: {
      id: req.usuario._id,
      nome: req.usuario.nome,
      email: req.usuario.email,
      perfil: req.usuario.perfil,
      telefone: req.usuario.telefone,
      cpf: req.usuario.cpf,
      endereco: req.usuario.endereco
    }
  });
};

const atualizarPerfil = async (req, res) => {
  try {
    const { nome, telefone, endereco } = req.body;
    const atualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { nome, telefone, endereco },
      { new: true, runValidators: true }
    );
    res.json({ success: true, usuario: atualizado });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { cadastrar, login, perfil, atualizarPerfil };

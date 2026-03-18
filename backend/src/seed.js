require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Usuario = require('./models/Usuario');
const Medico = require('./models/Medico');
const Agendamento = require('./models/Agendamento');
const BloqueioAgenda = require('./models/BloqueioAgenda');

const horariosManha = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'];
const horariosTarde = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
const horariosCompleto = [...horariosManha, ...horariosTarde];

const gradeSemanalPadrao = [
  { dia: 'domingo',  ativo: false, horarios: [] },
  { dia: 'segunda',  ativo: true,  horarios: horariosCompleto },
  { dia: 'terca',    ativo: true,  horarios: horariosCompleto },
  { dia: 'quarta',   ativo: true,  horarios: horariosCompleto },
  { dia: 'quinta',   ativo: true,  horarios: horariosCompleto },
  { dia: 'sexta',    ativo: true,  horarios: horariosCompleto },
  { dia: 'sabado',   ativo: true,  horarios: horariosManha },
];

const gradeSemanalManha = [
  { dia: 'domingo',  ativo: false, horarios: [] },
  { dia: 'segunda',  ativo: true,  horarios: horariosManha },
  { dia: 'terca',    ativo: true,  horarios: horariosManha },
  { dia: 'quarta',   ativo: false, horarios: [] },
  { dia: 'quinta',   ativo: true,  horarios: horariosManha },
  { dia: 'sexta',    ativo: true,  horarios: horariosManha },
  { dia: 'sabado',   ativo: false, horarios: [] },
];

const dadosMedicos = [
  { nome: 'Dr. Carlos Mendes',    especialidade: 'Clínica Geral',  crm: 'CRM/RJ 12345', telefone: '(21) 99001-0001', email: 'carlos.mendes@clinicafacil.com',    horariosSemana: gradeSemanalPadrao },
  { nome: 'Dra. Ana Lima',        especialidade: 'Clínica Geral',  crm: 'CRM/RJ 12346', telefone: '(21) 99001-0002', email: 'ana.lima@clinicafacil.com',         horariosSemana: gradeSemanalManha },
  { nome: 'Dr. Roberto Faria',    especialidade: 'Cardiologia',    crm: 'CRM/RJ 22345', telefone: '(21) 99002-0001', email: 'roberto.faria@clinicafacil.com',    horariosSemana: gradeSemanalPadrao },
  { nome: 'Dra. Patricia Souza',  especialidade: 'Cardiologia',    crm: 'CRM/RJ 22346', telefone: '(21) 99002-0002', email: 'patricia.souza@clinicafacil.com',   horariosSemana: gradeSemanalManha },
  { nome: 'Dra. Juliana Costa',   especialidade: 'Dermatologia',   crm: 'CRM/RJ 33345', telefone: '(21) 99003-0001', email: 'juliana.costa@clinicafacil.com',    horariosSemana: gradeSemanalPadrao },
  { nome: 'Dr. Eduardo Neves',    especialidade: 'Neurologia',     crm: 'CRM/RJ 44345', telefone: '(21) 99004-0001', email: 'eduardo.neves@clinicafacil.com',    horariosSemana: gradeSemanalManha },
  { nome: 'Dra. Fernanda Alves',  especialidade: 'Ginecologia',    crm: 'CRM/RJ 55345', telefone: '(21) 99005-0001', email: 'fernanda.alves@clinicafacil.com',   horariosSemana: gradeSemanalPadrao },
  { nome: 'Dr. Sérgio Mota',      especialidade: 'Ortopedia',      crm: 'CRM/RJ 66345', telefone: '(21) 99006-0001', email: 'sergio.mota@clinicafacil.com',      horariosSemana: gradeSemanalPadrao },
  { nome: 'Dra. Beatriz Santos',  especialidade: 'Pediatria',      crm: 'CRM/RJ 77345', telefone: '(21) 99007-0001', email: 'beatriz.santos@clinicafacil.com',   horariosSemana: gradeSemanalManha },
  { nome: 'Dra. Mônica Vieira',   especialidade: 'Psiquiatria',    crm: 'CRM/RJ 88345', telefone: '(21) 99008-0001', email: 'monica.vieira@clinicafacil.com',    horariosSemana: gradeSemanalPadrao },
];

const dadosUsuarios = [
  {
    nome: 'Caroline Admin',
    email: 'admin@clinicafacil.com',
    senha: 'Admin@123',
    perfil: 'admin',
    telefone: '(21) 99000-0001',
    cpf: '000.000.000-01'
  },
  {
    nome: 'Secretária Maria',
    email: 'secretaria@clinicafacil.com',
    senha: 'Secr@123',
    perfil: 'secretario',
    telefone: '(21) 99000-0002',
    cpf: '000.000.000-02'
  },
  {
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    senha: 'Paciente@123',
    perfil: 'paciente',
    telefone: '(21) 98001-0001',
    cpf: '111.111.111-11',
    endereco: { cep: '20040-020', logradouro: 'Av. Rio Branco', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ', numero: '100' }
  },
  {
    nome: 'Maria Oliveira',
    email: 'maria.oliveira@email.com',
    senha: 'Paciente@123',
    perfil: 'paciente',
    telefone: '(21) 98001-0002',
    cpf: '222.222.222-22',
    endereco: { cep: '22070-900', logradouro: 'Av. Atlântica', bairro: 'Copacabana', cidade: 'Rio de Janeiro', uf: 'RJ', numero: '200' }
  },
  {
    nome: 'Pedro Costa',
    email: 'pedro.costa@email.com',
    senha: 'Paciente@123',
    perfil: 'paciente',
    telefone: '(21) 98001-0003',
    cpf: '333.333.333-33',
    endereco: { cep: '20550-900', logradouro: 'Rua Voluntários da Pátria', bairro: 'Botafogo', cidade: 'Rio de Janeiro', uf: 'RJ', numero: '300' }
  },
  {
    nome: 'Ana Ferreira',
    email: 'ana.ferreira@email.com',
    senha: 'Paciente@123',
    perfil: 'paciente',
    telefone: '(21) 98001-0004',
    cpf: '444.444.444-44',
    endereco: { cep: '20230-013', logradouro: 'Rua da Lapa', bairro: 'Lapa', cidade: 'Rio de Janeiro', uf: 'RJ', numero: '50' }
  },
  {
    nome: 'Carlos Eduardo',
    email: 'carlos.eduardo@email.com',
    senha: 'Paciente@123',
    perfil: 'paciente',
    telefone: '(21) 98001-0005',
    cpf: '555.555.555-55',
    endereco: { cep: '20040-901', logradouro: 'Praça Mauá', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ', numero: '1' }
  },
];

// Gera data futura ou passada em dias úteis
function gerarData(diasOffset) {
  const d = new Date();
  d.setDate(d.getDate() + diasOffset);
  // Pula fins de semana
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  while (d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function seed() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado!\n');

    // ---- Limpa tudo ----
    console.log('🗑️  Limpando banco de dados...');
    await Promise.all([
      Usuario.deleteMany({}),
      Medico.deleteMany({}),
      Agendamento.deleteMany({}),
      BloqueioAgenda.deleteMany({})
    ]);
    console.log('✅ Banco limpo!\n');

    // ---- Usuários ----
    console.log('👥 Criando usuários...');
    const usuariosCriados = [];
    for (const u of dadosUsuarios) {
      const usuario = await Usuario.create(u);
      usuariosCriados.push(usuario);
      console.log(`   ✔ ${usuario.perfil.padEnd(10)} ${usuario.nome} — ${usuario.email}`);
    }
    console.log(`✅ ${usuariosCriados.length} usuários criados!\n`);

    const pacientes = usuariosCriados.filter(u => u.perfil === 'paciente');

    // ---- Médicos ----
    console.log('👨‍⚕️ Criando médicos...');
    const medicosCriados = await Medico.insertMany(dadosMedicos);
    medicosCriados.forEach(m => console.log(`   ✔ ${m.especialidade.padEnd(16)} ${m.nome}`));
    console.log(`✅ ${medicosCriados.length} médicos criados!\n`);

    // ---- Agendamentos ----
    console.log('📅 Criando agendamentos...');

    const agendamentos = [
      // Passados — realizados
      { paciente: pacientes[0]._id, medico: medicosCriados[2]._id, data: gerarData(-14), horario: '09:00', status: 'realizado',  observacoes: 'Consulta de rotina cardiovascular' },
      { paciente: pacientes[1]._id, medico: medicosCriados[0]._id, data: gerarData(-10), horario: '10:30', status: 'realizado',  observacoes: 'Gripe e febre' },
      { paciente: pacientes[2]._id, medico: medicosCriados[6]._id, data: gerarData(-7),  horario: '14:00', status: 'realizado',  observacoes: 'Consulta pré-natal' },
      { paciente: pacientes[3]._id, medico: medicosCriados[4]._id, data: gerarData(-5),  horario: '09:30', status: 'realizado',  observacoes: 'Avaliação de manchas na pele' },
      // Passados — cancelados
      { paciente: pacientes[4]._id, medico: medicosCriados[1]._id, data: gerarData(-3),  horario: '08:00', status: 'cancelado',  observacoes: '' },
      { paciente: pacientes[0]._id, medico: medicosCriados[7]._id, data: gerarData(-2),  horario: '15:00', status: 'cancelado',  observacoes: 'Dor no joelho' },
      // Próximos dias — confirmados
      { paciente: pacientes[1]._id, medico: medicosCriados[3]._id, data: gerarData(1),   horario: '09:00', status: 'confirmado', observacoes: 'Retorno cardiológico' },
      { paciente: pacientes[2]._id, medico: medicosCriados[8]._id, data: gerarData(2),   horario: '10:00', status: 'confirmado', observacoes: 'Consulta pediátrica — filho de 3 anos' },
      { paciente: pacientes[3]._id, medico: medicosCriados[5]._id, data: gerarData(3),   horario: '14:30', status: 'confirmado', observacoes: 'Dores de cabeça frequentes' },
      // Próximos dias — agendados
      { paciente: pacientes[0]._id, medico: medicosCriados[0]._id, data: gerarData(4),   horario: '08:30', status: 'agendado',   observacoes: 'Check-up anual' },
      { paciente: pacientes[4]._id, medico: medicosCriados[2]._id, data: gerarData(5),   horario: '11:00', status: 'agendado',   observacoes: 'Avaliação de pressão alta' },
      { paciente: pacientes[1]._id, medico: medicosCriados[9]._id, data: gerarData(7),   horario: '09:30', status: 'agendado',   observacoes: 'Ansiedade e insônia' },
      { paciente: pacientes[2]._id, medico: medicosCriados[4]._id, data: gerarData(8),   horario: '14:00', status: 'agendado',   observacoes: 'Acne persistente' },
      { paciente: pacientes[3]._id, medico: medicosCriados[6]._id, data: gerarData(10),  horario: '10:30', status: 'agendado',   observacoes: 'Consulta de rotina ginecológica' },
      { paciente: pacientes[4]._id, medico: medicosCriados[7]._id, data: gerarData(12),  horario: '15:30', status: 'agendado',   observacoes: 'Dor nas costas' },
    ];

    for (const ag of agendamentos) {
      await Agendamento.create(ag);
    }
    console.log(`✅ ${agendamentos.length} agendamentos criados!\n`);

    // ---- Bloqueio de exemplo ----
    console.log('🔒 Criando bloqueio de exemplo...');
    await BloqueioAgenda.create({
      medico: medicosCriados[0]._id,
      data: gerarData(6),
      horario: '13:00',
      motivo: 'Reunião administrativa'
    });
    console.log('✅ Bloqueio criado!\n');

    // ---- Resumo ----
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════\n');
    console.log('📋 ACESSOS PARA TESTE:\n');
    console.log('  👑 Admin');
    console.log('     E-mail : admin@clinicafacil.com');
    console.log('     Senha  : Admin@123\n');
    console.log('  🗂️  Secretária');
    console.log('     E-mail : secretaria@clinicafacil.com');
    console.log('     Senha  : Secr@123\n');
    console.log('  🧑 Paciente');
    console.log('     E-mail : joao.silva@email.com');
    console.log('     Senha  : Paciente@123\n');
    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB.');
    process.exit(0);
  }
}

seed();

// Testes de integração: rotas Express + MongoDB temporário em memória.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { Ocorrencia } = require('../src/models/Ocorrencia');
const { calcularIndicadores } = require('../src/services/indicadores');

let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('vigiachuva-teste'));
});

beforeEach(async () => {
  await Ocorrencia.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const hoje = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local

test('GET / exibe a introdução e o formulário', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /ODS 11/);
  assert.match(res.text, /<form action="\/ocorrencias" method="POST"/);
});

test('POST /ocorrencias inválido devolve 400 com mensagens e não grava nada', async () => {
  const res = await request(app).post('/ocorrencias').type('form').send({ bairro: 'X' });
  assert.equal(res.status, 400);
  assert.match(res.text, /Não foi possível salvar/);
  assert.equal(await Ocorrencia.countDocuments(), 0);
});

test('POST /ocorrencias válido grava no MongoDB, redireciona e confirma', async () => {
  const res = await request(app).post('/ocorrencias').type('form').send({
    tipo: 'Córrego ou rio transbordando',
    bairro: 'vila itaim',
    nivelAgua: 'Acima do joelho',
    descricao: 'Córrego invadiu a rua de baixo.',
    dataOcorrencia: hoje()
  });
  assert.equal(res.status, 303);
  assert.match(res.headers.location, /^\/ocorrencias\?criada=[a-f0-9]{24}$/);

  const salva = await Ocorrencia.findOne();
  assert.equal(salva.bairro, 'Vila Itaim');
  assert.equal(salva.prioridade, 'Alta');

  const pagina = await request(app).get(res.headers.location);
  assert.equal(pagina.status, 200);
  assert.match(pagina.text, /Ocorrência registrada com sucesso/);
  assert.match(pagina.text, /Vila Itaim/);
});

test('GET /ocorrencias filtra por prioridade', async () => {
  const res = await request(app).get('/ocorrencias?prioridade=Baixa');
  assert.equal(res.status, 200);
  assert.match(res.text, /Nenhuma ocorrência encontrada com esses filtros/);
});

test('rota inexistente devolve 404 com página amigável', async () => {
  const res = await request(app).get('/nao-existe');
  assert.equal(res.status, 404);
  assert.match(res.text, /Página não encontrada/);
});

test('conteúdo enviado pelo usuário é escapado (sem XSS)', async () => {
  await request(app).post('/ocorrencias').type('form').send({
    tipo: 'Outro',
    bairro: 'Centro',
    nivelAgua: 'Sem água acumulada',
    descricao: '<script>alert(1)</script> teste de segurança',
    dataOcorrencia: hoje()
  });
  const res = await request(app).get('/ocorrencias');
  assert.doesNotMatch(res.text, /<script>alert\(1\)<\/script>/);
  assert.match(res.text, /&lt;script&gt;/);
});

test('POST sem corpo de formulário devolve 400, não 500', async () => {
  const res = await request(app).post('/ocorrencias').send();
  assert.equal(res.status, 400);
});

test('calcularIndicadores agrega total, prioridade, categoria, bairros e últimos 7 dias', async () => {
  const agora = new Date('2026-11-07T15:00:00');
  const dia = (iso) => new Date(`${iso}T12:00:00Z`);
  const base = { nivelAgua: 'Sem água acumulada', descricao: 'Registro de teste do indicador.', motivoPrioridade: 'teste' };
  await Ocorrencia.insertMany([
    { ...base, tipo: 'Alagamento de via', bairro: 'Vila A', prioridade: 'Alta', dataOcorrencia: dia('2026-11-07') },
    { ...base, tipo: 'Alagamento de via', bairro: 'Vila A', prioridade: 'Alta', dataOcorrencia: dia('2026-11-01') },
    { ...base, tipo: 'Outro', bairro: 'Vila B', prioridade: 'Alta', dataOcorrencia: dia('2026-10-31') },
    { ...base, tipo: 'Outro', bairro: 'Vila B', prioridade: 'Baixa', dataOcorrencia: dia('2026-10-01') }
  ]);

  const ind = await calcularIndicadores(agora);

  assert.equal(ind.total, 4);
  assert.deepEqual(ind.porPrioridade.map((p) => [p.prioridade, p.quantidade, p.percentual]), [['Alta', 3, 75], ['Média', 0, 0], ['Baixa', 1, 25]]);
  assert.deepEqual(ind.porTipo.slice(0, 2).map((t) => [t.tipo, t.quantidade]), [['Alagamento de via', 2], ['Outro', 2]]);
  assert.deepEqual(ind.bairrosAtencao, [{ bairro: 'Vila A', quantidade: 2 }, { bairro: 'Vila B', quantidade: 1 }]);
  assert.equal(ind.ultimos7Dias, 2); // 07/11 e 01/11 entram; 31/10 fica fora (janela de 7 dias civis)
});

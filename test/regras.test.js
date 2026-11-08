const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarOcorrencia, normalizarBairro } = require('../src/services/validacao');
const { classificarPrioridade } = require('../src/services/prioridade');

const AGORA = new Date('2026-11-07T15:00:00');
const valido = {
  tipo: 'Alagamento de via',
  bairro: '  jardim   helena ',
  pontoReferencia: '',
  nivelAgua: 'Até o tornozelo (cerca de 10 cm)',
  descricao: 'Rua alagada depois da chuva da tarde.',
  dataOcorrencia: '2026-11-07'
};

test('aceita um registro válido e normaliza o bairro', () => {
  const { erros, dados } = validarOcorrencia(valido, AGORA);
  assert.deepEqual(erros, {});
  assert.equal(dados.bairro, 'Jardim Helena');
  assert.equal(dados.viaIntransitavel, false);
});

test('rejeita campos obrigatórios vazios com mensagens por campo', () => {
  const { erros } = validarOcorrencia({}, AGORA);
  assert.deepEqual(Object.keys(erros).sort(), ['bairro', 'dataOcorrencia', 'descricao', 'nivelAgua', 'tipo']);
});

test('rejeita tipo fora da lista e data no futuro', () => {
  const { erros } = validarOcorrencia({ ...valido, tipo: 'Invasão alienígena', dataOcorrencia: '2026-11-08' }, AGORA);
  assert.match(erros.tipo, /Selecione/);
  assert.match(erros.dataOcorrencia, /futuro/);
});

test('normaliza preposições em minúsculas', () => {
  assert.equal(normalizarBairro('VILA  DA  PAZ'), 'Vila da Paz');
});

test('prioridade Alta para tipo crítico, água no joelho ou via intransitável', () => {
  assert.equal(classificarPrioridade({ tipo: 'Deslizamento ou risco em encosta', nivelAgua: 'Sem água acumulada' }).prioridade, 'Alta');
  assert.equal(classificarPrioridade({ tipo: 'Outro', nivelAgua: 'Até o joelho (cerca de 50 cm)' }).prioridade, 'Alta');
  assert.equal(classificarPrioridade({ tipo: 'Outro', nivelAgua: 'Sem água acumulada', viaIntransitavel: true }).prioridade, 'Alta');
});

test('prioridade Média e Baixa conforme as regras', () => {
  assert.equal(classificarPrioridade({ tipo: 'Alagamento de via', nivelAgua: 'Até o tornozelo (cerca de 10 cm)' }).prioridade, 'Média');
  assert.equal(classificarPrioridade({ tipo: 'Bueiro ou boca de lobo entupido', nivelAgua: 'Sem água acumulada' }).prioridade, 'Média');
  assert.equal(classificarPrioridade({ tipo: 'Outro', nivelAgua: 'Sem água acumulada' }).prioridade, 'Baixa');
});

test('rejeita data inexistente no calendário e anterior a 2020', () => {
  assert.match(validarOcorrencia({ ...valido, dataOcorrencia: '2026-02-31' }, AGORA).erros.dataOcorrencia, /válida/);
  assert.match(validarOcorrencia({ ...valido, dataOcorrencia: '2019-12-31' }, AGORA).erros.dataOcorrencia, /a partir de/);
});

test('rejeita bairro sem letras e aceita corpo ausente sem quebrar', () => {
  assert.ok(validarOcorrencia({ ...valido, bairro: '--' }, AGORA).erros.bairro);
  assert.equal(Object.keys(validarOcorrencia(undefined, AGORA).erros).length, 5);
});

test('fiação caída é Alta; árvore ou galho caído é Média', () => {
  assert.equal(classificarPrioridade({ tipo: 'Fiação elétrica caída', nivelAgua: 'Sem água acumulada' }).prioridade, 'Alta');
  assert.equal(classificarPrioridade({ tipo: 'Árvore ou galho caído', nivelAgua: 'Sem água acumulada' }).prioridade, 'Média');
});

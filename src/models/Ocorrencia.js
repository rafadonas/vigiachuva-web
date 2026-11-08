const mongoose = require('mongoose');

// Domínios fechados: o formulário, a validação e os indicadores usam as mesmas listas.
const TIPOS = [
  'Alagamento de via',
  'Bueiro ou boca de lobo entupido',
  'Córrego ou rio transbordando',
  'Deslizamento ou risco em encosta',
  'Fiação elétrica caída',
  'Árvore ou galho caído',
  'Outro'
];

const NIVEIS_AGUA = [
  'Sem água acumulada',
  'Até o tornozelo (cerca de 10 cm)',
  'Até o joelho (cerca de 50 cm)',
  'Acima do joelho'
];

const PRIORIDADES = ['Alta', 'Média', 'Baixa'];

const ocorrenciaSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, enum: TIPOS },
    bairro: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    pontoReferencia: { type: String, trim: true, maxlength: 100, default: '' },
    nivelAgua: { type: String, required: true, enum: NIVEIS_AGUA },
    viaIntransitavel: { type: Boolean, default: false },
    descricao: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    dataOcorrencia: { type: Date, required: true },
    // Calculada pelo servidor (regra em services/prioridade.js), nunca enviada pelo usuário.
    prioridade: { type: String, required: true, enum: PRIORIDADES },
    motivoPrioridade: { type: String, required: true }
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } }
);

// Índices para a listagem (ordenada por data) e para os filtros.
ocorrenciaSchema.index({ dataOcorrencia: -1, criadoEm: -1 });
ocorrenciaSchema.index({ prioridade: 1 });
ocorrenciaSchema.index({ tipo: 1 });

const Ocorrencia = mongoose.model('Ocorrencia', ocorrenciaSchema, 'ocorrencias');

module.exports = { Ocorrencia, TIPOS, NIVEIS_AGUA, PRIORIDADES };

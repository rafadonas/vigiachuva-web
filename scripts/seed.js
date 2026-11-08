// Insere ocorrências FICTÍCIAS de exemplo para demonstrar a listagem e os indicadores.
// Uso: npm run seed  (adiciona os exemplos sem apagar o que já existe; rodar de novo duplica os exemplos)
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { Ocorrencia } = require('../src/models/Ocorrencia');
const { classificarPrioridade } = require('../src/services/prioridade');

const DIA_MS = 24 * 60 * 60 * 1000;
const diasAtras = (n) => {
  const d = new Date(Date.now() - n * DIA_MS);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12));
};

const EXEMPLOS = [
  { tipo: 'Alagamento de via', bairro: 'Jardim Helena', pontoReferencia: 'Próximo à praça central', nivelAgua: 'Até o joelho (cerca de 50 cm)', viaIntransitavel: true, descricao: 'Rua tomada pela água após 40 minutos de chuva forte; ônibus desviaram a rota.', dataOcorrencia: diasAtras(1) },
  { tipo: 'Bueiro ou boca de lobo entupido', bairro: 'Jardim Helena', pontoReferencia: 'Em frente à escola', nivelAgua: 'Sem água acumulada', viaIntransitavel: false, descricao: 'Boca de lobo coberta de folhas e lixo; já transbordou na última chuva.', dataOcorrencia: diasAtras(2) },
  { tipo: 'Córrego ou rio transbordando', bairro: 'Vila Itaim', pontoReferencia: 'Ponte de pedestres', nivelAgua: 'Acima do joelho', viaIntransitavel: true, descricao: 'Córrego saiu do leito e atingiu as casas da margem.', dataOcorrencia: diasAtras(3) },
  { tipo: 'Alagamento de via', bairro: 'Vila Itaim', pontoReferencia: '', nivelAgua: 'Até o tornozelo (cerca de 10 cm)', viaIntransitavel: false, descricao: 'Poça grande na calçada obriga pedestres a andar pela rua.', dataOcorrencia: diasAtras(5) },
  { tipo: 'Árvore ou galho caído', bairro: 'Cidade Tiradentes', pontoReferencia: 'Ao lado do posto de saúde', nivelAgua: 'Sem água acumulada', viaIntransitavel: false, descricao: 'Galho grande caiu sobre a calçada durante o temporal.', dataOcorrencia: diasAtras(9) },
  { tipo: 'Deslizamento ou risco em encosta', bairro: 'Cidade Tiradentes', pontoReferencia: 'Escadaria da viela', nivelAgua: 'Sem água acumulada', viaIntransitavel: false, descricao: 'Terra cedendo no barranco atrás das casas depois de três dias de chuva.', dataOcorrencia: diasAtras(10) },
  { tipo: 'Bueiro ou boca de lobo entupido', bairro: 'Itaim Paulista', pontoReferencia: 'Ponto de ônibus', nivelAgua: 'Até o tornozelo (cerca de 10 cm)', viaIntransitavel: false, descricao: 'Água não escoa e acumula no ponto de ônibus.', dataOcorrencia: diasAtras(12) },
  { tipo: 'Outro', bairro: 'Itaim Paulista', pontoReferencia: '', nivelAgua: 'Sem água acumulada', viaIntransitavel: false, descricao: 'Lixo acumulado na margem do córrego pode entupir a drenagem.', dataOcorrencia: diasAtras(15) }
];

async function semear() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vigiachuva';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const documentos = EXEMPLOS.map((e) => {
    const { prioridade, motivo } = classificarPrioridade(e);
    return { ...e, prioridade, motivoPrioridade: motivo };
  });
  await Ocorrencia.insertMany(documentos);
  console.log(`${documentos.length} ocorrências fictícias inseridas em ${uri}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  semear().catch((erro) => {
    console.error('Falha ao inserir exemplos:', erro.message);
    process.exit(1);
  });
}

module.exports = { EXEMPLOS };

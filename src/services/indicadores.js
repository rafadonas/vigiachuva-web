const { Ocorrencia, TIPOS, PRIORIDADES } = require('../models/Ocorrencia');
const { hojeISO } = require('./validacao');

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula os indicadores do painel a partir da coleção "ocorrencias".
 * O agrupamento acontece no próprio MongoDB (aggregate + $group).
 *
 * Indicadores:
 *  1. total        quantidade total de registros (pedido no enunciado)
 *  2. porPrioridade resumo por prioridade, com percentual (pedido no enunciado)
 *  3. porTipo      resumo por categoria, para saber qual problema mais se repete
 *  4. bairrosAtencao os 3 bairros com mais ocorrências de prioridade Alta (onde agir primeiro)
 *  5. ultimos7Dias ocorrências com data de hoje ou dos 6 dias anteriores (o problema está ativo agora?)
 */
async function calcularIndicadores(agora = new Date()) {
  // As datas são gravadas por dia (12:00 UTC); o corte também é por dia, para não variar com a hora.
  const inicioJanela = new Date(Date.parse(`${hojeISO(agora)}T00:00:00Z`) - 6 * DIA_MS);

  const [total, gruposPrioridade, gruposTipo, bairrosAtencao, ultimos7Dias] = await Promise.all([
    Ocorrencia.countDocuments(),
    Ocorrencia.aggregate([{ $group: { _id: '$prioridade', quantidade: { $sum: 1 } } }]),
    Ocorrencia.aggregate([{ $group: { _id: '$tipo', quantidade: { $sum: 1 } } }]),
    Ocorrencia.aggregate([
      { $match: { prioridade: 'Alta' } },
      { $group: { _id: '$bairro', quantidade: { $sum: 1 } } },
      { $sort: { quantidade: -1, _id: 1 } },
      { $limit: 3 }
    ]),
    Ocorrencia.countDocuments({ dataOcorrencia: { $gte: inicioJanela } })
  ]);

  const percentual = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));
  const contar = (grupos, chave) => grupos.find((g) => g._id === chave)?.quantidade ?? 0;

  // Mantém todas as categorias (inclusive as com zero) na ordem fixa do domínio.
  const porPrioridade = PRIORIDADES.map((p) => {
    const quantidade = contar(gruposPrioridade, p);
    return { prioridade: p, quantidade, percentual: percentual(quantidade) };
  });

  const porTipo = TIPOS.map((t) => {
    const quantidade = contar(gruposTipo, t);
    return { tipo: t, quantidade, percentual: percentual(quantidade) };
  }).sort((a, b) => b.quantidade - a.quantidade);

  return {
    total,
    porPrioridade,
    porTipo,
    bairrosAtencao: bairrosAtencao.map((b) => ({ bairro: b._id, quantidade: b.quantidade })),
    ultimos7Dias
  };
}

module.exports = { calcularIndicadores };

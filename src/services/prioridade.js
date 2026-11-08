const { NIVEIS_AGUA } = require('../models/Ocorrencia');

// Tipos que, por si só, indicam risco à vida ou ao patrimônio.
const TIPOS_CRITICOS = ['Córrego ou rio transbordando', 'Deslizamento ou risco em encosta', 'Fiação elétrica caída'];

/**
 * Classifica a prioridade de atendimento por regras simples e explicáveis.
 *  - Alta:  tipo crítico (córrego transbordando, deslizamento, fiação caída),
 *           água no joelho ou acima, ou via intransitável.
 *  - Média: água até o tornozelo, bueiro entupido (risco de piorar na próxima chuva)
 *           ou árvore/galho caído (obstrui a passagem).
 *  - Baixa: demais casos.
 * Devolve também o motivo, exibido na listagem para dar transparência à regra.
 */
function classificarPrioridade({ tipo, nivelAgua, viaIntransitavel }) {
  const indiceNivel = NIVEIS_AGUA.indexOf(nivelAgua);

  if (TIPOS_CRITICOS.includes(tipo)) {
    return { prioridade: 'Alta', motivo: `Tipo crítico: ${tipo.toLowerCase()}` };
  }
  if (indiceNivel >= 2) {
    return { prioridade: 'Alta', motivo: 'Água no joelho ou acima' };
  }
  if (viaIntransitavel) {
    return { prioridade: 'Alta', motivo: 'Via intransitável' };
  }
  if (indiceNivel === 1) {
    return { prioridade: 'Média', motivo: 'Água até o tornozelo' };
  }
  if (tipo === 'Bueiro ou boca de lobo entupido') {
    return { prioridade: 'Média', motivo: 'Bueiro entupido pode causar alagamento' };
  }
  if (tipo === 'Árvore ou galho caído') {
    return { prioridade: 'Média', motivo: 'Árvore ou galho obstruindo a passagem' };
  }
  return { prioridade: 'Baixa', motivo: 'Sem risco imediato informado' };
}

module.exports = { classificarPrioridade, TIPOS_CRITICOS };

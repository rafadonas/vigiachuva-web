const { TIPOS, NIVEIS_AGUA } = require('../models/Ocorrencia');

const DATA_MINIMA = '2020-01-01';
const PALAVRAS_MINUSCULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

// "  jardim   são  luís " -> "Jardim São Luís": evita que o mesmo bairro conte duas vezes nos indicadores.
function normalizarBairro(texto) {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((p, i) => (i > 0 && PALAVRAS_MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

function hojeISO(agora = new Date()) {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Valida os campos recebidos do formulário.
 * Retorna { erros, dados }: "erros" mapeia campo -> mensagem (vazio = válido)
 * e "dados" contém os valores já limpos e convertidos.
 */
function validarOcorrencia(corpo = {}, agora = new Date()) {
  const erros = {};
  corpo = corpo && typeof corpo === 'object' ? corpo : {};
  // \r\n (Windows) vira \n para o tamanho no servidor bater com o maxlength do navegador.
  const texto = (v) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '');

  const tipo = texto(corpo.tipo);
  const bairro = texto(corpo.bairro);
  const pontoReferencia = texto(corpo.pontoReferencia);
  const nivelAgua = texto(corpo.nivelAgua);
  const descricao = texto(corpo.descricao);
  const dataOcorrencia = texto(corpo.dataOcorrencia);
  const viaIntransitavel = corpo.viaIntransitavel === 'sim';

  if (!TIPOS.includes(tipo)) erros.tipo = 'Selecione a categoria da ocorrência.';

  if (bairro.length < 2 || bairro.length > 60) {
    erros.bairro = 'Informe o bairro (2 a 60 caracteres).';
  } else if (!/^[\p{L}0-9 .'-]+$/u.test(bairro) || (bairro.match(/\p{L}/gu) || []).length < 2) {
    erros.bairro = 'O bairro deve ter ao menos 2 letras e usar apenas letras, números, espaço, ponto, apóstrofo ou hífen.';
  }

  if (pontoReferencia.length > 100) erros.pontoReferencia = 'O ponto de referência deve ter até 100 caracteres.';

  if (!NIVEIS_AGUA.includes(nivelAgua)) erros.nivelAgua = 'Selecione o nível da água.';

  if (descricao.length < 10 || descricao.length > 500) {
    erros.descricao = 'Descreva a situação com 10 a 500 caracteres.';
  }

  // Reconverter a data e comparar evita que "2026-02-31" vire 3 de março sem aviso.
  const dataConvertida = new Date(`${dataOcorrencia}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataOcorrencia) ||
    Number.isNaN(dataConvertida.getTime()) ||
    dataConvertida.toISOString().slice(0, 10) !== dataOcorrencia
  ) {
    erros.dataOcorrencia = 'Informe uma data válida.';
  } else if (dataOcorrencia > hojeISO(agora)) {
    erros.dataOcorrencia = 'A data não pode estar no futuro.';
  } else if (dataOcorrencia < DATA_MINIMA) {
    erros.dataOcorrencia = `Informe uma data a partir de ${DATA_MINIMA.split('-').reverse().join('/')}.`;
  }

  const dados = {
    tipo,
    bairro: erros.bairro ? bairro : normalizarBairro(bairro),
    pontoReferencia,
    nivelAgua,
    viaIntransitavel,
    descricao,
    // Meio-dia UTC evita que o fuso horário "volte" a data para o dia anterior.
    dataOcorrencia: erros.dataOcorrencia ? null : dataConvertida
  };

  return { erros, dados };
}

module.exports = { validarOcorrencia, normalizarBairro, hojeISO };

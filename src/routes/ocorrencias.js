const express = require('express');
const { Ocorrencia, TIPOS, NIVEIS_AGUA, PRIORIDADES } = require('../models/Ocorrencia');
const { validarOcorrencia, hojeISO } = require('../services/validacao');
const { classificarPrioridade } = require('../services/prioridade');
const { calcularIndicadores } = require('../services/indicadores');

const router = express.Router();

function renderizarFormulario(res, status, { valores = {}, erros = {} } = {}) {
  res.status(status).render('index', {
    titulo: 'Registrar ocorrência',
    TIPOS,
    NIVEIS_AGUA,
    valores,
    erros,
    hoje: hojeISO()
  });
}

// GET /: introdução e formulário de cadastro
router.get('/', (req, res) => renderizarFormulario(res, 200));

// POST /ocorrencias: recebe o formulário, valida, classifica e grava no MongoDB
router.post('/ocorrencias', async (req, res, next) => {
  const { erros, dados } = validarOcorrencia(req.body);

  if (Object.keys(erros).length > 0) {
    return renderizarFormulario(res, 400, { valores: req.body, erros });
  }

  try {
    const { prioridade, motivo } = classificarPrioridade(dados);
    const ocorrencia = await Ocorrencia.create({ ...dados, prioridade, motivoPrioridade: motivo });
    // Padrão Post/Redirect/Get: recarregar a página não duplica o registro.
    return res.redirect(303, `/ocorrencias?criada=${ocorrencia._id}`);
  } catch (erro) {
    return next(erro);
  }
});

// GET /ocorrencias: consulta com filtros opcionais, listagem e indicadores
router.get('/ocorrencias', async (req, res, next) => {
  try {
    const filtros = {};
    if (TIPOS.includes(req.query.tipo)) filtros.tipo = req.query.tipo;
    if (PRIORIDADES.includes(req.query.prioridade)) filtros.prioridade = req.query.prioridade;

    const [ocorrencias, indicadores] = await Promise.all([
      Ocorrencia.find(filtros).sort({ dataOcorrencia: -1, criadoEm: -1 }).limit(200).lean(),
      calcularIndicadores()
    ]);

    let criada = null;
    if (typeof req.query.criada === 'string' && /^[a-f0-9]{24}$/.test(req.query.criada)) {
      criada = await Ocorrencia.findById(req.query.criada).lean();
    }

    res.render('ocorrencias', {
      titulo: 'Ocorrências e indicadores',
      ocorrencias,
      indicadores,
      filtros,
      criada,
      TIPOS,
      PRIORIDADES
    });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;

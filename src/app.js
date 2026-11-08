const path = require('path');
const express = require('express');
const ocorrenciasRouter = require('./routes/ocorrencias');

const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/', ocorrenciasRouter);

// 404: nenhuma rota acima respondeu
app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página não encontrada', caminho: req.path });
});

// Erros: requisição inválida (400/413) ou falha inesperada (500, ex.: banco fora do ar).
// Não expõe detalhes técnicos ao usuário.
app.use((erro, req, res, next) => {
  if (res.headersSent) return next(erro);
  const codigo = erro.status || erro.statusCode;
  const status = codigo >= 400 && codigo < 500 ? codigo : 500;
  if (status === 500) console.error('[erro]', erro.message);
  res.status(status).render('erro', {
    titulo: status === 500 ? 'Erro no servidor' : 'Requisição inválida',
    codigo: status,
    mensagem:
      status === 500
        ? 'Não foi possível concluir a operação agora. Verifique se o MongoDB está em execução e tente novamente.'
        : 'Os dados enviados não puderam ser processados (formato inválido ou tamanho acima do permitido).'
  });
});

module.exports = app;

// Modo demonstração para quem NÃO tem MongoDB instalado.
// Sobe um MongoDB temporário em memória (mongodb-memory-server), insere os exemplos e inicia o servidor.
// Os dados somem ao encerrar. Para uso normal, rode "npm start" com um MongoDB de verdade.
require('dotenv').config({ quiet: true });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { Ocorrencia } = require('../src/models/Ocorrencia');
const { classificarPrioridade } = require('../src/services/prioridade');
const { EXEMPLOS } = require('./seed');

async function demo() {
  console.log('Iniciando MongoDB em memória (no primeiro uso o binário é baixado, pode demorar)...');
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('vigiachuva'));
  await Ocorrencia.insertMany(
    EXEMPLOS.map((e) => {
      const { prioridade, motivo } = classificarPrioridade(e);
      return { ...e, prioridade, motivoPrioridade: motivo };
    })
  );

  const app = require('../src/app');
  const porta = Number(process.env.PORT) || 3000;
  const servidor = app.listen(porta, () => {
    console.log(`VigiaChuva Web (DEMO, dados em memória) em http://localhost:${porta}`);
    console.log('Pressione Ctrl+C para encerrar.');
  });

  const encerrar = async () => {
    servidor.close();
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}

demo().catch((erro) => {
  console.error('Falha no modo demonstração:', erro.message);
  process.exit(1);
});

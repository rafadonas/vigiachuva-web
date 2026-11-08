require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('./app');

const PORTA = Number(process.env.PORT) || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vigiachuva';

async function iniciar() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB conectado em ${MONGODB_URI.replace(/\/\/[^@/]*@/, '//***@')}`);
  } catch (erro) {
    console.error('Não foi possível conectar ao MongoDB:', erro.message);
    console.error('Inicie o MongoDB local ou ajuste MONGODB_URI no arquivo .env (veja o README).');
    console.error('Sem MongoDB instalado? Use "npm run demo" (banco temporário em memória).');
    process.exit(1);
  }

  app.listen(PORTA, () => console.log(`VigiaChuva Web rodando em http://localhost:${PORTA}`));
}

iniciar();

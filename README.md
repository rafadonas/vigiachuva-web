# ☔ VigiaChuva Web

Protótipo web para registrar e acompanhar ocorrências de alagamento e drenagem urbana.
Global Solution 2026.2, FIAP, Application Development (Prof. Allan Roberto Molto), desafio CitizenTech.

**Integrantes:** Rafael do Nascimento Silva, RM 566263 · Guilherme Morais de Assis, RM 564198
**Vídeo pitch:** [YouTube](https://youtu.be/N1baXNlel8Q) (2 min 57 s, legendado; o arquivo gravado acompanha a entrega como `VigiaChuva_pitch_AD.mp4`)

## Problema, público-alvo e objetivo
- **Problema:** em chuvas fortes, ruas alagadas, bueiros entupidos e córregos transbordando bloqueiam a passagem e põem pessoas em risco. Quem mora no bairro sabe onde isso acontece, mas a informação se perde em conversas e não vira dado para planejar a manutenção.
- **Público-alvo:** moradores e lideranças comunitárias de áreas sujeitas a alagamento, que registram e consultam ocorrências, e equipes de zeladoria e Defesa Civil, que decidem onde atender primeiro.
- **Objetivo:** reunir os registros, classificar a prioridade por regras transparentes e gerar indicadores que mostrem o que mais se repete e onde agir primeiro.

## ODS relacionados
- **ODS 11, Cidades e comunidades sustentáveis**, meta 11.5: até 2030, reduzir significativamente as mortes e o número de pessoas afetadas por catástrofes, inclusive as relacionadas à água (NAÇÕES UNIDAS BRASIL, [20--]a).
- **ODS 13, Ação contra a mudança global do clima**, meta 13.1: reforçar a resiliência e a capacidade de adaptação a riscos relacionados ao clima e às catástrofes naturais (NAÇÕES UNIDAS BRASIL, [20--]b).

## Como executar
Pré-requisitos: **Node.js 20 ou superior** e **MongoDB** rodando localmente (porta padrão 27017).

```bash
npm install
cp .env.example .env      # opcional (Windows: copy .env.example .env); o padrão já é mongodb://127.0.0.1:27017/vigiachuva
npm run seed              # opcional: insere 8 ocorrências fictícias de exemplo
npm start                 # http://localhost:3000
```

**Sem MongoDB instalado?** Rode `npm run demo`. Ele sobe um MongoDB temporário em memória (o binário é baixado no primeiro uso), insere os exemplos e inicia o servidor. Os dados somem ao encerrar.
**Testes:** `npm test` executa 17 testes automatizados (validação, regras de prioridade, rotas GET/POST, 404, indicadores e escape de HTML), usando um MongoDB temporário em memória.

## Rotas
| Método | Rota | O que faz |
|---|---|---|
| GET | `/` | Introdução e formulário de cadastro |
| POST | `/ocorrencias` | Valida os campos, calcula a prioridade e grava na coleção `ocorrencias` do MongoDB. Se houver erro, devolve 400 com as mensagens; se der certo, redireciona com confirmação |
| GET | `/ocorrencias` | Lista os registros (com filtros opcionais `?tipo=` e `?prioridade=`) e mostra os indicadores |
| qualquer outra | — | Página 404 amigável |

Cada registro tem: **categoria** (tipo de ocorrência), **bairro**, ponto de referência (opcional), **nível da água**, via intransitável (sim ou não), **descrição** e **data**. A **prioridade** é calculada pelo servidor.

## Indicadores
| Indicador | Como é calculado | Para que serve |
|---|---|---|
| **Total de registros** | `countDocuments()` | Mostra o volume de problemas relatados |
| **Resumo por prioridade** | `aggregate` + `$group` por prioridade, com percentual | Mostra quanto do total exige ação urgente |
| Resumo por categoria | `$group` por tipo, em ordem decrescente | Aponta qual problema mais se repete (ex.: bueiros, que pedem limpeza preventiva) |
| Bairros que pedem atenção | Os 3 bairros com mais ocorrências de prioridade Alta | Indica onde agir primeiro |
| Últimos 7 dias | Ocorrências com data de hoje ou dos 6 dias anteriores | Indica se o problema está ativo agora |

**Regra de prioridade** (em `src/services/prioridade.js`):
- **Alta:** córrego transbordando, deslizamento ou fiação elétrica caída; água no joelho ou acima; ou via intransitável.
- **Média:** água até o tornozelo, bueiro entupido, ou árvore/galho caído.
- **Baixa:** demais casos.

O motivo da classificação aparece em cada registro. A regra apoia a triagem; quem decide o atendimento é a equipe responsável.

## Organização dos arquivos
```
src/server.js          conexão com o MongoDB e início do servidor
src/app.js             Express: middlewares, rotas, 404 e tratamento de erro
src/routes/            rotas GET e POST
src/models/            schema Mongoose da coleção "ocorrencias"
src/services/          validação, regra de prioridade e indicadores
views/                 páginas EJS (formulário, listagem, 404, erro)
public/css/            estilos
scripts/               dados de exemplo (seed) e modo demonstração
test/                  testes automatizados (node:test + supertest)
```

## Privacidade
O formulário não pede nome, telefone nem número de casa: o registro descreve o local, não pessoas. Os exemplos do `seed` são fictícios.

## Referências
NAÇÕES UNIDAS BRASIL. **Objetivo de Desenvolvimento Sustentável 11**: cidades e comunidades sustentáveis. Brasília, DF: ONU Brasil, [20--]a. Disponível em: https://brasil.un.org/pt-br/sdgs/11. Acesso em: 7 nov. 2026.

NAÇÕES UNIDAS BRASIL. **Objetivo de Desenvolvimento Sustentável 13**: ação contra a mudança global do clima. Brasília, DF: ONU Brasil, [20--]b. Disponível em: https://brasil.un.org/pt-br/sdgs/13. Acesso em: 7 nov. 2026.

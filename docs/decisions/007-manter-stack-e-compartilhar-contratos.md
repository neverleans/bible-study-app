# ADR 007 - Manter a stack atual e compartilhar contratos entre API e frontend

**Data:** 2026-11-16
**Status:** Proposta (aguarda aprovação do dono do projeto)

## Contexto

Surgiu a pergunta se vale trocar a stack por "tecnologias melhores" (Node.js, React, Next.js,
NestJS, PostgreSQL, Redis). Antes de comparar, o estado real:

| Tecnologia citada | Já usada? |
|---|---|
| Node.js | Sim (runtime de API e frontend, adapter-node) |
| NestJS | Sim (API) |
| PostgreSQL | Sim (16, com RLS e full-text) |
| Redis | Sim (7, filas BullMQ) |
| TypeScript | Sim, em tudo |
| React + Next.js | **Não**: o frontend é SvelteKit + Svelte 5 |

Portanto a única troca real em discussão é **SvelteKit → React/Next.js**. O restante já é o que
se propõe.

## Avaliação: SvelteKit vs Next.js

| Critério | SvelteKit (atual) | Next.js (React) |
|---|---|---|
| Custo de migrar hoje | — | Baixo a médio: 5 rotas, 11 componentes, 4 stores, sem testes de frontend para proteger a reescrita; mas é retrabalho sem funcionalidade nova |
| Papel do servidor do frontend | SSR simples; a lógica fica na NestJS | Next traz API routes/Server Actions que **duplicariam** a NestJS; teríamos que impor disciplina para não criar dois backends |
| Peso e simplicidade | Bundles menores, reatividade direta (runes) | Mais código de cliente e mais conceitos (RSC, cache, boundaries) |
| Ecossistema de componentes | Menor | **Muito maior** (editores ricos, tabelas, kits de UI) |
| Contratação / comunidade | Menor | **Muito maior** |
| App móvel futuro | PWA ou reescrita | React Native/Expo pode reaproveitar lógica e conhecimento |
| Alinhamento com o ADR 001 | Decisão vigente | Exigiria revogar o ADR 001 |

Nenhuma dor atual do produto é causada pelo SvelteKit. Os problemas reais (tipos duplicados,
ausência de testes, conteúdo limitado) existem igualmente em qualquer framework.

## Outras tecnologias avaliadas

- **Prisma:** já rejeitado no ADR 006 (RLS, pool, engine). Manter Drizzle.
- **Fastify no lugar de Express no Nest:** ganho de desempenho irrelevante para a carga atual.
- **Elasticsearch/Meilisearch:** não; ~31 mil versículos cabem folgados no full-text do PostgreSQL.
- **WebSocket/SSE para a IA:** polling a cada 2 s basta; reavaliar só se houver geração longa em tela.
- **tRPC/GraphQL:** não; REST + contrato gerado resolve sem trocar de paradigma.
- **Upgrades:** avaliar NestJS 11 e zod 4 em PRs próprios, com testes passando.

## Decisão

1. **Manter** SvelteKit, NestJS, PostgreSQL, Redis, Drizzle e o monorepo pnpm + Turborepo.
2. **Atacar a dor real:** eliminar a duplicação de tipos. Caminho recomendado: gerar o cliente
   e os tipos do frontend a partir do OpenAPI que a NestJS já publica em `/api/docs` (ou, como
   alternativa mais simples, um pacote `packages/contracts` com tipos/zod compartilhados).
3. **Criar a base de testes do frontend** (Vitest para stores/utilitários, Playwright para o
   fluxo ler → destacar → quiz) antes de qualquer mudança grande de UI.
4. **Gatilhos para reabrir a discussão de Next.js/React:** decisão de lançar app móvel com código
   compartilhado; necessidade de um componente que só exista em React (ex.: editor rico);
   time com maioria de pessoas desenvolvedoras React; ou mudança de requisito para SEO
   fortemente dinâmico que o SSR atual não atenda.

## Consequências

- **Positivas:** zero retrabalho; energia vai para conteúdo e para a camada didática; contratos
  tipados reduzem bugs de integração.
- **Negativas:** ecossistema e mercado de contratação menores que o de React; se um gatilho
  acima ocorrer, a migração será feita com mais código no frontend do que hoje.

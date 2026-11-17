# Arquitetura

Aplicativo de estudo bíblico didático: leitura, destaques semânticos, palavras originais
(hebraico/grego), quiz com IA e progresso. Este arquivo é o mapa geral; os detalhes ficam em
[docs/architecture/](docs/architecture/) e as decisões em [docs/decisions/](docs/decisions/).

## Visão geral

```
  Navegador
     │  HTTP (SSR + navegação no cliente)
     ▼
  SvelteKit (packages/frontend, adapter-node)
     │  HTTP/JSON  (JWT ou header x-user-id de visitante)
     ▼
  NestJS API (packages/api)  ──── Swagger em /api/docs
     │            │
     │            └── BullMQ (fila "ai-analysis") ──► worker ──► Gemini
     ▼                         ▲
  PostgreSQL 16 (Drizzle, RLS) │
  Redis 7 (filas BullMQ) ──────┘
```

Regra do projeto: **toda chamada de IA passa pela API**, nunca pelo navegador, e nenhum segredo
vai para o frontend.

## Stack

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend | SvelteKit 2 + Svelte 5 (runes), Tailwind CSS v4, Vite 6 | Rotas, SSR, UI |
| API | NestJS 10, class-validator, Swagger, Helmet, Throttler (120 req/min) | REST, validação, auth |
| Dados | PostgreSQL 16 + Drizzle ORM (`postgres-js`) | Texto bíblico, dados do usuário, RLS |
| Filas/cache | Redis 7 + BullMQ | Geração assíncrona por IA |
| IA | Google Gemini (`@google/genai`), validação com zod | Análises e quiz |
| Linguagem | TypeScript em tudo, pnpm + Turborepo | Monorepo |
| CI | GitHub Actions: lint, typecheck, testes unitários, build | `.github/workflows/ci.yml` |

## Estrutura do repositório

```
packages/
  api/src/
    modules/   auth, bible, search, notes, highlights, progress, original, quiz,
               review, reflections, completion, study-aids, ai
    database/  schema/ (Drizzle), migrations/ (+ rollback/), seeds/
    common/    decorators, filtros
  frontend/src/
    routes/    /, /[book], /[book]/[chapter], /[book]/complete, /notes, /search, /review
    lib/       api/client.ts, art/ (arte procedural), stores/ (auth, study, theme, user),
               components/, types/
docs/          architecture/, decisions/ (ADRs), testing/, runbooks/
scripts/       verify-fast.sh, verify.sh
```

## Modelo de dados (resumo)

Detalhes em [docs/architecture/data-model.md](docs/architecture/data-model.md).

- **Texto:** `books`, `chapters`, `verses` (ACF em português, busca full-text `portuguese` com GIN).
- **Do usuário, com RLS:** `notes`, `highlights`, `reading_progress`, `quiz_attempts`, `review_cards`,
  `reflections`.
- **Referência pública:** `original_words` e `lexicon_entries` (STEPBible, CC BY 4.0), `study_aids`
  (curado), `quizzes` (gerado por IA), `ai_cache`.

**RLS:** cada consulta de dados do usuário roda numa transação que executa
`set_config('app.current_user_id', <uuid>, true)`; as políticas comparam `user_id` com essa
configuração. A aplicação conecta com um papel sem `BYPASSRLS` (`biblia_app`); migrations rodam
como dono do banco.

## Fluxos principais

**Ler um capítulo.** O `load` do SvelteKit chama `GET /bible/books/:abbrev/chapters/:n`. Depois
de montar a página, o cliente busca em paralelo notas, destaques, progresso, palavras originais
e recursos de estudo.

**Visitante e conta.** Sem login, notas, destaques e progresso ficam em `localStorage`. No
login/cadastro são enviados para a conta e a tela recarrega os dados da nuvem
(`stores/auth.ts`, `stores/study.ts`). Notas só vão à API quando autenticado; tentativas de quiz
sempre vão à API, sob o ID de visitante, e **não** migram para a conta.

**Palavras originais.** `GET /original/:book/:chapter` devolve as palavras agrupadas por
versículo (mesma versificação do texto em português); `GET /lexicon/:strong` devolve o verbete,
com fallback de sub-sentidos para o verbete principal. Livros não importados respondem
`available:false` e o painel some.

**Quiz por IA.** `POST /quiz/chapter/:book/:chapter/generate` enfileira o job `chapter-quiz`; o
worker chama o Gemini, valida a saída com zod e grava em `quizzes`. O cliente acompanha com
`GET /quiz/chapter/...` (polling). O gabarito só sai depois de `POST /quiz/:id/attempts`, que
corrige no servidor. Sem chave ou com saída inválida o job falha; não há quiz inventado.

**Explique com suas palavras.** `POST /reflections` salva o texto da pessoa e enfileira o job
`reflection-feedback`; o worker pede ao Gemini uma comparação com o texto do capítulo (pontos
captados, faltantes e equívocos com versículo), valida com zod e grava. O cliente acompanha o
estado (`pending` → `done` | `failed`) por polling. O texto nunca se perde; sem chave ou com saída
inválida o feedback fica `failed` com o motivo, sem feedback inventado.

**Continuar estudando.** A home lê o progresso (local para visitante, `GET /progress` na conta) e
mostra o próximo capítulo não lido depois do último lido, em ordem canônica
(`lib/study/continue.ts`, função pura testada), além de uma barra de progresso em cada livro.

**Cartão de conclusão do livro.** `/[book]/complete` junta o que o servidor sabe
(`GET /completion/:book`: melhor nota do quiz por capítulo, explicações, cartões) com o que o
visitante guarda localmente (capítulos lidos e destaques, via `stores/study.ts`). A arte é SVG
procedural e determinístico (`lib/art/bookArt.ts`: paleta e símbolo por gênero literário, padrão
semeado pela ordem do livro), sem imagens hospedadas nem IA. O botão "Baixar PNG" desenha o SVG num
canvas. O cartão aparece como "Em andamento" até todos os capítulos serem lidos.

**Revisão espaçada.** Erros do quiz viram cartões `review_cards` no momento da correção, e o
usuário pode adicionar um versículo com “Revisar depois”. `GET /review/due` lista o que venceu;
`POST /review/cards/:id/grade` (errei/acertei/fácil) reagenda com SM-2. A rota `/review` faz a
sessão e o menu mostra quantos cartões vencem. Cartões de visitante não migram para a conta.

## Contrato API ↔ frontend

A NestJS é a fonte da verdade. `pnpm contracts:generate` (1) cria o app sem subir serviços e grava
`packages/api/openapi.json` e (2) gera `packages/frontend/src/lib/api/schema.d.ts` com
`openapi-typescript`. O frontend deriva seus tipos de lá (`lib/types/index.ts`), então mudar um DTO
quebra a compilação onde ele é usado. O CI roda a geração e falha se os dois arquivos gerados não
estiverem commitados. Ao mudar um DTO: `pnpm contracts:generate` e commitar o resultado.

## Decisões transversais

- **Auth:** JWT de acesso (15 min) + refresh (7 dias); `OptionalJwtAuthGuard` aceita visitante
  via `x-user-id`.
- **Validação:** `ValidationPipe` global com DTOs; saída da IA validada com zod.
- **Migrations:** geradas com `drizzle-kit`, cada uma com script de rollback manual em
  `migrations/rollback/`.
- **Atribuição de dados:** STEPBible/Tyndale House (CC BY 4.0) é creditado na interface.

## Dívidas e riscos conhecidos

1. **Tipos de IA ainda à mão:** o contrato OpenAPI cobre tudo, exceto o `data` das respostas de
   análise por IA (documentado como objeto aberto). Ver
   [ADR 007](docs/decisions/007-manter-stack-e-compartilhar-contratos.md).
2. **Poucos testes no frontend:** só o Vitest de `stores/auth` e o `svelte-check`; falta E2E (Playwright).
3. **`overview.md` e ADRs antigos** citavam Prisma e WebSocket; a IA hoje usa polling.
4. **Cache de IA** (`ai_cache`) sem versionamento de prompt e com fallback genérico nas análises
   de capítulo/livro (o quiz já não tem fallback).
5. **Grants manuais** das tabelas novas ao papel `biblia_app` em dev (documentado em `data-model.md`).
6. Página do capítulo (`[book]/[chapter]/+page.svelte`, ~410 linhas; barra de observar e navegação já extraídas, falta separar o estado de notas e estudo) acima do limite de 300
   linhas do padrão do projeto.
7. Conteúdo didático (study aids, quizzes, originais) cobre poucos livros; o gargalo é conteúdo,
   não código.

## Como rodar e verificar

```bash
docker compose up -d && pnpm install && pnpm db:migrate && pnpm dev
bash scripts/verify-fast.sh    # lint + typecheck + unit
bash scripts/verify.sh         # verificação completa
```

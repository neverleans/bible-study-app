# 📖 Plataforma de Estudo Bíblico & Exegese com IA (Documentação em Português)

> Para a versão em inglês, veja [English README](README.md).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.3-ea2845?logo=nestjs)](https://nestjs.com/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.0-ff3e00?logo=svelte)](https://kit.svelte.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.0-orange)](https://bullmq.io/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.30-c5f74f)](https://orm.drizzle.team/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.5-black?logo=turborepo)](https://turbo.build/)
[![Tests](https://img.shields.io/badge/Tests-62%20Passing-brightgreen?logo=jest)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> Plataforma web moderna de alta performance para leitura bíblica, exegese teológica, pesquisa contextual e anotações pessoais, com isolamento criptográfico por **PostgreSQL Row-Level Security (RLS)**, filas distribuídas com **BullMQ + Redis**, busca full-text com dicionário em português e análises hermenêuticas via **Google Gemini**.

---

## 🏛️ Visão Geral da Arquitetura

O projeto foi concebido seguindo os mais rigorosos padrões de engenharia de software corporativa: monorepo com contratos fortemente tipados de ponta a ponta (100% TypeScript), separação clara de responsabilidades, arquitetura orientada a eventos e processamento assíncrono.

```mermaid
flowchart TD
    subgraph Client["Frontend (SvelteKit 2 + Tailwind v4)"]
        UI["Interface Reativa / Svelte 5 Runes"]
        Store["Auth & Guest Store (Local + Cloud Sync)"]
        ClientAPI["Typed API Client"]
    end

    subgraph API["Backend Gateway (NestJS 10)"]
        Guard["JWT & Optional Auth Guards"]
        Throttler["Rate Limiting (120 req/min)"]
        Controller["Controllers RESTful + Swagger"]
        Service["Feature Services"]
        QueueProducer["BullMQ Queue Producer"]
    end

    subgraph Workers["Processamento Assíncrono"]
        Worker["BullMQ Worker (AiAnalysisProcessor)"]
        Gemini["Google Gemini 2.5 Flash"]
    end

    subgraph Storage["Camada de Persistência & Cache"]
        Redis[("Redis 7 (Jobs Queue & Cache)")]
        PG[("PostgreSQL 16\n- 66 Livros / 31.106 Versículos\n- tsvector GIN Index (Full-Text)\n- Row-Level Security (NOBYPASSRLS)\n- ai_cache (SHA-256 Hashing)")]
    end

    UI --> Store
    Store --> ClientAPI
    ClientAPI -->|HTTP / REST| Guard
    Guard --> Throttler --> Controller --> Service

    Service -->|Leitura / Busca / RLS Notes| PG
    Service -->|Despacha Job| QueueProducer
    QueueProducer -->|Enfileira| Redis
    Worker -->|Consome Job| Redis
    Worker -->|Requisição Exegese| Gemini
    Worker -->|Cacheia Resultado| PG
```

---

## 🚀 Diferenciais de Engenharia

### 1. PostgreSQL Row-Level Security (RLS) Nativo
Diferente de aplicações comuns que confiam apenas na cláusula `WHERE user_id = ...` na aplicação (vulnerável a vazamentos de dados por erro humano), este projeto delega o controle de acesso ao **núcleo do banco de dados**:
* Conexão da API configurada com a role `biblia_app` com privilégio estrito `NOBYPASSRLS`.
* Transações isoladas via `SET LOCAL app.current_user_id = '...'`.
* Políticas de segurança RLS aplicadas nativamente nas tabelas de anotações pessoais, impedindo qualquer vazamento entre usuários mesmo sob falha na camada de aplicação.

### 2. Busca Full-Text de Alta Performance (Português)
* Geração automática de coluna `tsvector` com o dicionário de stemming em língua portuguesa (`config = 'portuguese'`).
* **Índice GIN Invertido** cobrindo todos os **31.106 versículos bíblicos**, garantindo tempos de busca inferiores a 10ms.
* Algoritmo de relevância `ts_rank_cd` com destaques contextuais gerados em banco via `ts_headline`.

### 3. Fila Distribuída e Resiliência com BullMQ + Redis
* Chamadas para a API do Google Gemini são processadas de forma assíncrona por **Workers BullMQ**, prevenindo gargalos de conexão HTTP e timeouts.
* **Cache Determinístico** com hash SHA-256 dos prompts armazenado em PostgreSQL (`ai_cache`), economizando requisições e proporcionando respostas instantâneas para capítulos já analisados.
* Polling reativo no frontend com feedback de ciclo de vida (`queued` -> `active` -> `completed`).

### 4. Modo Visitante Inteligente (Guest Mode) & Sincronização em Nuvem
* **Acesso Livre:** Visitantes não logados navegam livremente pela Bíblia completa, utilizam a busca, visualizam recursos de estudo e podem criar anotações locais salvas no `localStorage`.
* **Migração Transparente em 1 Clique:** No momento em que o visitante cria uma conta ou faz login, o sistema detecta as anotações feitas no navegador e executa a sincronização em lote para o PostgreSQL sob a nova identidade RLS, sem perda de dados.

### 5. Blindagem de Segurança & Observabilidade
* Autenticação via **JWT (Access Token de 15m + Refresh Token rotativo de 7d)** com hash de senha `bcryptjs` (salt rounds: 10).
* Proteção contra ataques de negação de serviço e scraping com `@nestjs/throttler` (limite global de 120 req/min).
* Headers de segurança HTTP ativados via `helmet`.
* Documentação viva e interativa de todos os endpoints via **Swagger OpenAPI** em `/api/docs`.
* Endpoint de monitoramento de saúde `/health` utilizando `@nestjs/terminus`.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Motivação & Benefício |
|---|---|---|
| **Monorepo** | Turborepo + pnpm | Pipeline de build ultrarrápida, cache de tarefas e workspaces organizados |
| **Backend** | NestJS 10 + Express | Arquitetura modular padrão corporativo com Injeção de Dependências |
| **Frontend** | SvelteKit 2 + Svelte 5 Runes | Reatividade nativa compilada de altíssima performance e sem overhead de Virtual DOM |
| **Estilização** | Tailwind CSS v4 | Estilização utilitária de última geração com suporte nativo a Dark Mode |
| **Banco de Dados** | PostgreSQL 16 | Suporte robusto a RLS, índices GIN e extensão full-text em português |
| **ORM** | Drizzle ORM | Type-safety absoluta sem overhead de runtime, com total controle sobre SQL |
| **Filas & Cache** | Redis 7 + BullMQ 5 | Fila distribuída de alta vazão para processamento de background jobs |
| **IA / LLM** | Google Gemini (`@google/genai`) | Análise teológica, exegese de capítulos e reflexões panorâmicas de livros |
| **Testes** | Jest + Supertest | Cobertura rigorosa com testes unitários e E2E em todos os módulos |

---

## 📊 Estrutura do Monorepo

```
projeto-estudo-biblia/
├── packages/
│   ├── api/                     # Backend NestJS
│   │   ├── src/
│   │   │   ├── database/        # Schema Drizzle, migrações e seeds (66 livros / 31.106 versículos)
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # JWT, Refresh Tokens, Bcrypt, Guards
│   │   │   │   ├── bible/       # Catálogo de livros, capítulos e versículos
│   │   │   │   ├── search/      # Full-Text Search com tsvector e GIN
│   │   │   │   ├── notes/       # CRUD de notas isolado com PostgreSQL RLS
│   │   │   │   ├── ai/          # Gemini AI + BullMQ Worker + SHA-256 Cache
│   │   │   │   └── study-aids/  # Resumos, versículos-chave e referências cruzadas
│   │   │   ├── common/          # Decorators, interceptors, filtros e pipes globais
│   │   │   └── health/          # Verificação de integridade com @nestjs/terminus
│   │   └── test/                # Testes E2E (auth, bible, search, notes, ai, study-aids)
│   │
│   └── frontend/                # Frontend SvelteKit
│       └── src/
│           ├── lib/
│           │   ├── api/         # Cliente HTTP tipado com tratamento de erros
│           │   ├── components/  # Componentes reativos (Leitor, Notas, Busca, Modais de IA)
│           │   ├── stores/      # Stores Svelte (Auth, Sessão, Guest Notes)
│           │   └── types/       # Definições de tipos TypeScript compartilhadas
│           └── routes/          # Rotas SvelteKit (Home, Leitor, Busca, Notas)
│
├── docker-compose.yml           # PostgreSQL 16 (porta 5434) + Redis 7 (porta 6381)
├── turbo.json                   # Configuração de build e pipeline do Turborepo
└── pnpm-workspace.yaml          # Definição de pacotes do monorepo
```

---

## 🚦 Como Executar o Projeto Localmente

### Pré-requisitos
* **Node.js** >= 20.x
* **pnpm** >= 9.x
* **Docker & Docker Compose**

### Passo a Passo
```bash
# 1. Instalar dependências
pnpm install

# 2. Subir infraestrutura Docker (PostgreSQL 16 + Redis 7)
docker compose up -d

# 3. Configurar variáveis de ambiente
cp packages/api/.env.example packages/api/.env

# 4. Executar migrações do banco de dados e seeds
pnpm db:push
pnpm db:seed

# 5. Iniciar ambiente de desenvolvimento
pnpm dev
```

---

## 🧪 Suíte de Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes com cobertura
pnpm test:cov
```

---

## 📜 Licença

Distribuído sob a licença **MIT**.

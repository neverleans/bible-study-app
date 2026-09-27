# Architecture Overview

See [docs/architecture/overview.md](docs/architecture/overview.md) for details.

## System Diagram

```
SvelteKit (Frontend) ──HTTP──> NestJS (API) ──> PostgreSQL
                                    │
                                    ├──> Redis (Cache + Sessions)
                                    │
                                    └──> BullMQ Workers ──> Gemini AI
```

## Packages
- `packages/frontend` — SvelteKit app (SSR + SSG)
- `packages/api` — NestJS API (REST + WebSocket)

## Data Flow
1. SvelteKit load functions call NestJS API
2. NestJS controllers validate input and delegate to services
3. Services interact with PostgreSQL via Prisma
4. AI requests go through BullMQ for async processing
5. Results cached in Redis and persisted in PostgreSQL

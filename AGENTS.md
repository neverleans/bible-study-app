# Agent Instructions

This project follows the AI Coding Engineering OS.

## Entry points
- API: packages/api/src/main.ts
- Frontend: packages/frontend/src/routes/+layout.svelte

## Key directories
- packages/api/src/modules/ — NestJS feature modules
- packages/api/src/database/ — Prisma schema + migrations + seeds
- packages/api/src/common/ — Shared guards, filters, pipes, interceptors
- packages/frontend/src/routes/ — SvelteKit pages
- packages/frontend/src/lib/components/ — Reusable components
- packages/frontend/src/lib/api/ — API client
- docs/ — Detailed documentation

## Commands
| Action | Command |
|---|---|
| Install deps | `pnpm install` |
| Start infra | `docker compose up -d` |
| Run migrations | `pnpm db:migrate` |
| Dev mode | `pnpm dev` |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test:unit` |
| Full verify | `bash scripts/verify.sh` |

## Module pattern (NestJS)
Each feature is a module with: module.ts, controller.ts, service.ts, dto/

## Testing expectations
- Every API endpoint needs at least a unit test
- User-facing flows need Playwright E2E tests
- Bug fixes must include a regression test

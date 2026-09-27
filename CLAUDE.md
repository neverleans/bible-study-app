# Project Instructions

## Read first
- ARCHITECTURE.md
- docs/index.md
- docs/testing/README.md

## Stack
- Frontend: SvelteKit + TailwindCSS v4 (packages/frontend/)
- Backend: NestJS + Prisma (packages/api/)
- Database: PostgreSQL 16
- Cache/Queue: Redis 7 + BullMQ
- Language: TypeScript (all packages)
- Monorepo: pnpm + Turborepo

## Run
```bash
docker compose up -d          # Start PostgreSQL + Redis
pnpm install                   # Install dependencies
pnpm db:migrate                # Run migrations
pnpm dev                       # Start all services
```

## Test
```bash
bash scripts/verify-fast.sh    # Lint + typecheck + unit
bash scripts/verify.sh         # Full verification
```

## Critical rules
- NEVER expose API keys or secrets in frontend code
- NEVER skip regression tests for bug fixes
- Do not mark a feature complete until its acceptance test passes
- All AI calls go through the NestJS API, never from the browser
- Database changes require migration files with rollback capability

## Change workflow
1. Inspect relevant code and docs
2. State the intended change
3. Identify risk and affected flows
4. Implement the smallest viable change
5. Run targeted tests
6. Run regression suite
7. Run E2E when behavior is user-facing
8. Review diff
9. Update docs/tests when behavior changes

## Architecture map
See docs/architecture/

## Testing map
See docs/testing/

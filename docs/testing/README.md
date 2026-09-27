# Testing Strategy

This project follows a 5-level testing strategy:

1. **Static Analysis:** ESLint, Prettier, TypeScript compiler (run via `pnpm lint` and `pnpm typecheck`).
2. **Unit Tests:** Jest for API, Vitest for Frontend (run via `pnpm test:unit`). Focus on isolated logic.
3. **Integration Tests:** Supertest for API endpoints (with a test database).
4. **Regression Tests:** Tests designed specifically to catch previously fixed bugs.
5. **E2E Tests:** Playwright for critical user flows in the frontend.

## CI/CD
All PRs must pass `bash scripts/verify.sh` before merging.

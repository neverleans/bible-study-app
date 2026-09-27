# 006 - Migration from Prisma to Drizzle ORM for PostgreSQL RLS & Performance

- **Status:** Accepted
- **Date:** 2026-09-27
- **Deciders:** Engineering Team

## Context

In our initial design, Prisma ORM was introduced for data access and migrations. However, upon evaluating production requirements around Row-Level Security (RLS) for multi-tenancy (per OS §13 and §14) and PostgreSQL full-text search (`tsvector` with GIN indexing), significant architectural issues with Prisma were identified:

1. **Connection Pooling Contamination:** Setting session variables (`SET LOCAL app.current_user_id`) in Prisma requires interactive `$transaction` blocks on every query to prevent session state from leaking across pooled connections. This introduces major latency and connection exhaustion risks.
2. **Lack of Declarative RLS:** Prisma's schema DSL lacks any native syntax for `pgPolicy` or `ENABLE ROW LEVEL SECURITY`.
3. **Rust Query Engine Abstraction:** The binary query engine adds overhead and impedes direct access to native PostgreSQL features like generated columns (`to_tsvector`) and GIN indexes.

## Decision

We have migrated from Prisma to **Drizzle ORM** with `postgres-js`:

1. All schemas defined declaratively in TypeScript (`packages/api/src/database/schema/`).
2. Declarative PostgreSQL Row-Level Security via `pgPolicy(...)` and `.enableRLS()` directly in table definitions.
3. Native support for PostgreSQL `tsvector` generated columns and GIN indexes (`.using('gin', table.searchVector)`).
4. Direct, human-readable SQL migrations generated via `drizzle-kit generate` and run through an auditable migration script (`migrate.ts`).

## Consequences

- **Positive:**
  - Zero binary engine overhead (pure TypeScript).
  - Native, leak-proof RLS enforcement directly at the database layer.
  - Sub-second migration generation producing auditable standard SQL.
  - Instant full-text search queries utilizing PostgreSQL's native GIN index without raw string casting workarounds.
  - Complete alignment with the AI Coding Engineering OS (§13 Business Invariants and §14 Data Integrity).
- **Negative:**
  - Requires writing TypeScript schema definitions and relations explicitly instead of a proprietary DSL (which is actually preferred for full type-safety).

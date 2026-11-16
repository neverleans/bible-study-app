# Data Model

PostgreSQL 16 accessed through **Drizzle ORM** (`packages/api/src/database/schema/`).
Migrations live in `packages/api/src/database/migrations/` (generated with `pnpm db:generate`,
applied with `pnpm db:migrate`). Each migration has a manual rollback script in
`migrations/rollback/<same-name>.down.sql` (Drizzle does not run these automatically).

**Local dev roles:** `.env` connects as `biblia_app` (no `BYPASSRLS`, not the table owner), which cannot
run DDL. Run migrations as the owner (`DATABASE_URL=postgresql://biblia:biblia@localhost:5434/biblia pnpm db:migrate`)
and then grant the app role access to each new table, e.g.
`GRANT SELECT, INSERT, UPDATE, DELETE ON highlights, reading_progress TO biblia_app;`.

Tables marked **RLS** use Row-Level Security: every query runs inside a transaction that first calls
`set_config('app.current_user_id', <uuid>, true)`; policies compare `user_id` to that setting.

## Tables

### `users`
`id` uuid PK · `email` unique · `passwordHash` · `name` · `provider` (default `local`) · `preferences` jsonb · timestamps.
Guest identifiers (`x-user-id`) get a placeholder row created on first write.

### `books`
`id` serial PK · `abbrev` unique · `name` · `testament` (`'OT'`/`'NT'`, text) · `chapterCount` · `order`.

### `chapters`
`id` · `bookId` FK · `number` · `verses` text[] — unique (`bookId`, `number`).

### `verses`
`id` · `bookId` FK · `chapterId` FK · `number` · `text` · `search_vector` (generated tsvector, `portuguese`, GIN index).
Text is the ACF translation. Original-language data is **not** stored yet (planned: separate interlinear tables).

### `notes` — RLS
`id` uuid · `userId` FK · `bookId` FK · `chapterNumber` · `verseNumber` · `content` · timestamps.

### `highlights` — RLS
`id` uuid · `userId` FK · `bookId` FK · `chapterNumber` · `verseNumber` · `color` · timestamps.
`color` is one of `person | place | repeat | promise | sequence | contrast` (validated by the DTO,
list in `schema/highlights.ts`). Unique (`userId`, `bookId`, `chapterNumber`, `verseNumber`): one
highlight per verse; changing color is an upsert.

### `reading_progress` — RLS
`id` uuid · `userId` FK · `bookId` FK · `chapterNumber` · `completedAt`.
Unique (`userId`, `bookId`, `chapterNumber`): marking a read chapter again only refreshes the date.

### `study_aids`
`id` · `bookId` FK · `type` (`summary | key_verse | cross_ref | context`) · `content` · `metadata` jsonb · `createdAt`.
Curated content (seed); the chapter number lives in `metadata.chapterNumber`.

### `ai_cache`
`id` uuid · `bookId` FK · `chapterNumber` (nullable) · `analysisType` (`chapter_analysis | book_reflection`) ·
`promptHash` unique · `response` (JSON string) · `metadata` · `createdAt` · `expiresAt`.

## Guest mode
Unauthenticated users keep notes, highlights and reading progress in `localStorage`
(`biblia_guest_notes`, `biblia_guest_highlights`, `biblia_guest_progress`); on login/register they are
synced to the cloud (`stores/auth.ts`, `stores/study.ts`).

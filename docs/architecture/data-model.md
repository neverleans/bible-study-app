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
Text is the ACF translation. Original-language words live in `original_words` (below).

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

### `original_words`
One row per Hebrew (OT) / Greek (NT) word: `bookId` · `chapterNumber` · `verseNumber` · `position` · `lang` (`heb`/`grc`) ·
`surface` · `transliteration` · `gloss` (English) · `strong` (extended, e.g. `H1697G`) · `morph` · `lemma`.
Unique (`bookId`, `chapterNumber`, `verseNumber`, `position`). Same (English/KJV) versification as `verses`.
Public data, no RLS.

### `lexicon_entries`
`strong` PK (extended Strong, as used in `original_words.strong`) · `lang` · `lemma` · `transliteration` · `morph` · `gloss` · `meaning`.

**Source and license:** STEPBible-Data (TAHOT, TAGNT, TBESH, TBESG), Tyndale House Cambridge / STEPBible.org,
CC BY 4.0 (attribution shown in the UI). Import with
`pnpm --filter api db:seed:original <dir> [--books=jn,mc]` after downloading the files from
https://github.com/STEPBible/STEPBible-Data into an empty directory (names starting with `tahot`, `tagnt`,
`tbesh`, `tbesg`). Only the base reading is imported (Leningrad / NA28). Pilot books so far: Jonas (`jn`) and Marcos (`mc`).
The app role needs `GRANT SELECT ON original_words, lexicon_entries` (and `USAGE, SELECT` on `original_words_id_seq`
for whoever runs the seed).

### `quizzes`
`id` uuid · `bookId` FK · `chapterNumber` · `promptVersion` · `model` · `questions` jsonb · `createdAt`.
AI-generated chapter quiz (shared, no RLS), unique (`bookId`, `chapterNumber`, `promptVersion`). Each question stores
`question`, 4 `options`, `correctIndex`, `explanation` and the `verse` it is based on. The API never sends
`correctIndex`/`explanation` before an attempt is graded. Generated through the `ai-analysis` BullMQ queue
(`chapter-quiz` job) with zod validation (`modules/quiz/quiz.schemas.ts`); there is no canned fallback, a missing
`GEMINI_API_KEY` or invalid output marks the job failed.

### `quiz_attempts` — RLS
`id` uuid · `userId` FK · `quizId` FK · `answers` jsonb (chosen index per question) · `score` · `total` · `createdAt`.
Grading happens on the server. Guests use the `x-user-id` header; attempts are not migrated to an account on login yet.

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

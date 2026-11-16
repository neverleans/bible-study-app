import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

/**
 * Semantic highlight colors used in the "Observe" step of the inductive method.
 * Kept as text + DTO validation (same approach as study_aids.type) so adding a
 * color never needs a migration.
 */
export const HIGHLIGHT_COLORS = [
  'person',
  'place',
  'repeat',
  'promise',
  'sequence',
  'contrast',
] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

const ownsRow = sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`;

export const highlights = pgTable(
  'highlights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    color: text('color').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('highlights_user_id_idx').on(table.userId),
    index('highlights_book_chapter_idx').on(table.bookId, table.chapterNumber),
    // One highlight per verse per user; changing color is an upsert.
    uniqueIndex('highlights_user_verse_uq').on(
      table.userId,
      table.bookId,
      table.chapterNumber,
      table.verseNumber,
    ),
    pgPolicy('user_select_own_highlights', { for: 'select', using: ownsRow }),
    pgPolicy('user_insert_own_highlights', { for: 'insert', withCheck: ownsRow }),
    pgPolicy('user_update_own_highlights', { for: 'update', using: ownsRow, withCheck: ownsRow }),
    pgPolicy('user_delete_own_highlights', { for: 'delete', using: ownsRow }),
  ],
).enableRLS();

export type Highlight = typeof highlights.$inferSelect;
export type NewHighlight = typeof highlights.$inferInsert;

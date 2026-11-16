import {
  pgTable,
  uuid,
  integer,
  timestamp,
  index,
  uniqueIndex,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

const ownsRow = sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`;

export const readingProgress = pgTable(
  'reading_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('reading_progress_user_id_idx').on(table.userId),
    uniqueIndex('reading_progress_user_chapter_uq').on(
      table.userId,
      table.bookId,
      table.chapterNumber,
    ),
    pgPolicy('user_select_own_progress', { for: 'select', using: ownsRow }),
    pgPolicy('user_insert_own_progress', { for: 'insert', withCheck: ownsRow }),
    pgPolicy('user_update_own_progress', { for: 'update', using: ownsRow, withCheck: ownsRow }),
    pgPolicy('user_delete_own_progress', { for: 'delete', using: ownsRow }),
  ],
).enableRLS();

export type ReadingProgress = typeof readingProgress.$inferSelect;
export type NewReadingProgress = typeof readingProgress.$inferInsert;

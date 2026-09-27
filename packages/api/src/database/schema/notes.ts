import { pgTable, uuid, integer, text, timestamp, index, pgPolicy } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('notes_user_id_idx').on(table.userId),
    index('notes_book_chapter_idx').on(table.bookId, table.chapterNumber),
    pgPolicy('user_select_own_notes', {
      for: 'select',
      using: sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`,
    }),
    pgPolicy('user_insert_own_notes', {
      for: 'insert',
      withCheck: sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`,
    }),
    pgPolicy('user_update_own_notes', {
      for: 'update',
      using: sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`,
      withCheck: sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`,
    }),
    pgPolicy('user_delete_own_notes', {
      for: 'delete',
      using: sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`,
    }),
  ],
).enableRLS();

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

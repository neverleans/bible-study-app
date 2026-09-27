import { pgTable, serial, integer, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { books } from './books';

export const chapters = pgTable(
  'chapters',
  {
    id: serial('id').primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    number: integer('number').notNull(),
    verses: text('verses').array().notNull(),
  },
  (table) => [
    uniqueIndex('chapters_book_number_idx').on(table.bookId, table.number),
  ],
);

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  abbrev: text('abbrev').unique().notNull(),
  name: text('name').notNull(),
  testament: text('testament').notNull(), // 'OT' | 'NT'
  chapterCount: integer('chapter_count').notNull(),
  order: integer('order').notNull(),
});

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

import { pgTable, serial, integer, text, uniqueIndex, index, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { books } from './books';
import { chapters } from './chapters';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const verses = pgTable(
  'verses',
  {
    id: serial('id').primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: integer('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    number: integer('number').notNull(),
    text: text('text').notNull(),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      (): any => sql`to_tsvector('portuguese', ${verses.text})`,
    ),
  },
  (table) => [
    uniqueIndex('verses_chapter_number_idx').on(table.chapterId, table.number),
    index('verses_book_id_idx').on(table.bookId),
    index('verses_search_vector_idx').using('gin', table.searchVector),
  ],
);

export type Verse = typeof verses.$inferSelect;
export type NewVerse = typeof verses.$inferInsert;

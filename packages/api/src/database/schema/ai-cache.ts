import { pgTable, uuid, integer, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { books } from './books';

export const aiCache = pgTable(
  'ai_cache',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number'),
    analysisType: text('analysis_type').notNull(), // 'chapter_analysis' | 'book_reflection'
    promptHash: text('prompt_hash').unique().notNull(),
    response: text('response').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('ai_cache_book_chapter_idx').on(table.bookId, table.chapterNumber),
  ],
);

export type AiCache = typeof aiCache.$inferSelect;
export type NewAiCache = typeof aiCache.$inferInsert;

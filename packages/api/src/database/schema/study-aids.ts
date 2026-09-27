import { pgTable, serial, integer, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { books } from './books';

export const studyAids = pgTable(
  'study_aids',
  {
    id: serial('id').primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(), // 'summary' | 'key_verse' | 'cross_ref' | 'context'
    content: text('content').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('study_aids_book_type_idx').on(table.bookId, table.type),
  ],
);

export type StudyAid = typeof studyAids.$inferSelect;
export type NewStudyAid = typeof studyAids.$inferInsert;

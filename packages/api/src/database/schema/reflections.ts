import {
  pgTable,
  uuid,
  integer,
  text,
  jsonb,
  timestamp,
  index,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

const ownsRow = sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`;

export const REFLECTION_FEEDBACK_STATUS = ['pending', 'done', 'failed'] as const;
export type ReflectionFeedbackStatus = (typeof REFLECTION_FEEDBACK_STATUS)[number];

/** AI feedback on what the learner wrote. Always anchored in the chapter text. */
export interface ReflectionFeedback {
  coveredPoints: string[];
  missingPoints: string[];
  misunderstandings: { claim: string; correction: string; verse: number }[];
  encouragement: string;
}

/**
 * "Explain it in your own words": the learner's own summary of a chapter (self-explanation).
 * The text is always saved; the AI feedback is generated afterwards through the queue.
 */
export const reflections = pgTable(
  'reflections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    content: text('content').notNull(),
    feedbackStatus: text('feedback_status').notNull().default('pending'),
    feedback: jsonb('feedback').$type<ReflectionFeedback>(),
    feedbackError: text('feedback_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('reflections_user_chapter_idx').on(table.userId, table.bookId, table.chapterNumber),
    pgPolicy('user_select_own_reflections', { for: 'select', using: ownsRow }),
    pgPolicy('user_insert_own_reflections', { for: 'insert', withCheck: ownsRow }),
    pgPolicy('user_update_own_reflections', { for: 'update', using: ownsRow, withCheck: ownsRow }),
    pgPolicy('user_delete_own_reflections', { for: 'delete', using: ownsRow }),
  ],
).enableRLS();

export type Reflection = typeof reflections.$inferSelect;

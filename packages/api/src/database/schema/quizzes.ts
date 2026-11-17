import {
  pgTable,
  uuid,
  integer,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

/** One question as stored. The answer key never leaves the API before an attempt is graded. */
export interface StoredQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Verse of the chapter the question is based on. */
  verse: number;
}

/**
 * AI-generated chapter quiz (shared content, no RLS). `promptVersion` lets a better prompt
 * replace old quizzes without losing the history of attempts made against them.
 */
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    promptVersion: integer('prompt_version').notNull().default(1),
    model: text('model').notNull(),
    questions: jsonb('questions').$type<StoredQuizQuestion[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('quizzes_chapter_version_uq').on(
      table.bookId,
      table.chapterNumber,
      table.promptVersion,
    ),
  ],
);

const ownsRow = sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`;

export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    quizId: uuid('quiz_id')
      .references(() => quizzes.id, { onDelete: 'cascade' })
      .notNull(),
    answers: jsonb('answers').$type<number[]>().notNull(),
    score: integer('score').notNull(),
    total: integer('total').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('quiz_attempts_user_quiz_idx').on(table.userId, table.quizId),
    pgPolicy('user_select_own_attempts', { for: 'select', using: ownsRow }),
    pgPolicy('user_insert_own_attempts', { for: 'insert', withCheck: ownsRow }),
    pgPolicy('user_delete_own_attempts', { for: 'delete', using: ownsRow }),
  ],
).enableRLS();

export type Quiz = typeof quizzes.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

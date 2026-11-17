import {
  pgTable,
  uuid,
  integer,
  text,
  real,
  timestamp,
  index,
  uniqueIndex,
  pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';

const ownsRow = sql`user_id = nullif(current_setting('app.current_user_id', true), '')::uuid`;

export const REVIEW_CARD_KINDS = ['verse', 'quiz'] as const;
export type ReviewCardKind = (typeof REVIEW_CARD_KINDS)[number];

/**
 * Spaced-repetition card (SM-2). `sourceKey` makes creation idempotent: a verse card is
 * `verse:<chapter>:<verse>` and a missed quiz question is `quiz:<quizId>:<questionIndex>`.
 */
export const reviewCards = pgTable(
  'review_cards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number'),
    kind: text('kind').notNull(),
    sourceKey: text('source_key').notNull(),
    /** Shown first; the learner tries to recall the answer. */
    prompt: text('prompt').notNull(),
    answer: text('answer').notNull(),
    ease: real('ease').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    dueAt: timestamp('due_at', { withTimezone: true }).defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('review_cards_user_due_idx').on(table.userId, table.dueAt),
    uniqueIndex('review_cards_user_source_uq').on(table.userId, table.bookId, table.sourceKey),
    pgPolicy('user_select_own_cards', { for: 'select', using: ownsRow }),
    pgPolicy('user_insert_own_cards', { for: 'insert', withCheck: ownsRow }),
    pgPolicy('user_update_own_cards', { for: 'update', using: ownsRow, withCheck: ownsRow }),
    pgPolicy('user_delete_own_cards', { for: 'delete', using: ownsRow }),
  ],
).enableRLS();

export type ReviewCard = typeof reviewCards.$inferSelect;
export type NewReviewCard = typeof reviewCards.$inferInsert;

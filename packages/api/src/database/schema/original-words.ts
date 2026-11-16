import {
  pgTable,
  serial,
  integer,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { books } from './books';

/**
 * Interlinear layer: one row per original-language word (Hebrew OT / Greek NT).
 * Source: STEPBible TAHOT/TAGNT (Tyndale House, CC BY 4.0). Verse numbers follow the
 * same (English/KJV) versification as the ACF text stored in `verses`.
 * Public reference data, so no RLS.
 */
export const originalWords = pgTable(
  'original_words',
  {
    id: serial('id').primaryKey(),
    bookId: integer('book_id')
      .references(() => books.id, { onDelete: 'cascade' })
      .notNull(),
    chapterNumber: integer('chapter_number').notNull(),
    verseNumber: integer('verse_number').notNull(),
    position: integer('position').notNull(),
    lang: text('lang').notNull(), // 'heb' | 'grc'
    surface: text('surface').notNull(),
    transliteration: text('transliteration'),
    gloss: text('gloss'),
    strong: text('strong'), // extended Strong, e.g. H1697G / G0746
    morph: text('morph'),
    lemma: text('lemma'),
  },
  (table) => [
    uniqueIndex('original_words_verse_pos_uq').on(
      table.bookId,
      table.chapterNumber,
      table.verseNumber,
      table.position,
    ),
    index('original_words_chapter_idx').on(table.bookId, table.chapterNumber),
    index('original_words_strong_idx').on(table.strong),
  ],
);

/** Lexicon entries keyed by extended Strong (TBESH Hebrew / TBESG Greek). */
export const lexiconEntries = pgTable('lexicon_entries', {
  strong: text('strong').primaryKey(),
  lang: text('lang').notNull(),
  lemma: text('lemma').notNull(),
  transliteration: text('transliteration'),
  morph: text('morph'),
  gloss: text('gloss'),
  meaning: text('meaning'),
});

export type OriginalWord = typeof originalWords.$inferSelect;
export type NewOriginalWord = typeof originalWords.$inferInsert;
export type LexiconEntry = typeof lexiconEntries.$inferSelect;

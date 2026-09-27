import { relations } from 'drizzle-orm';
import { users } from './users';
import { books } from './books';
import { chapters } from './chapters';
import { verses } from './verses';
import { notes } from './notes';
import { studyAids } from './study-aids';
import { aiCache } from './ai-cache';

export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
}));

export const booksRelations = relations(books, ({ many }) => ({
  chapters: many(chapters),
  verses: many(verses),
  notes: many(notes),
  studyAids: many(studyAids),
  aiCache: many(aiCache),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
  verses: many(verses),
}));

export const versesRelations = relations(verses, ({ one }) => ({
  book: one(books, {
    fields: [verses.bookId],
    references: [books.id],
  }),
  chapter: one(chapters, {
    fields: [verses.chapterId],
    references: [chapters.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [notes.bookId],
    references: [books.id],
  }),
}));

export const studyAidsRelations = relations(studyAids, ({ one }) => ({
  book: one(books, {
    fields: [studyAids.bookId],
    references: [books.id],
  }),
}));

export const aiCacheRelations = relations(aiCache, ({ one }) => ({
  book: one(books, {
    fields: [aiCache.bookId],
    references: [books.id],
  }),
}));

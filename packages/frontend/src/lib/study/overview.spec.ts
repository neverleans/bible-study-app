import { describe, it, expect } from 'vitest';
import { overviewOf } from './overview';
import type { BookRef, ReadItem } from './continue';

const books: BookRef[] = [
  { abbrev: 'gn', name: 'Gênesis', order: 1, chapterCount: 3 },
  { abbrev: 'jn', name: 'Jonas', order: 32, chapterCount: 2 },
  { abbrev: 'mt', name: 'Mateus', order: 40, chapterCount: 2 },
];
const read = (bookAbbrev: string, chapterNumber: number): ReadItem => ({
  bookAbbrev,
  chapterNumber,
  completedAt: '2026-11-16T10:00:00.000Z',
});

describe('overviewOf', () => {
  it('is empty and safe with no books', () => {
    expect(overviewOf([], [])).toMatchObject({ chaptersRead: 0, chapterCount: 0, percent: 0, byGenre: [] });
  });

  it('totals chapters and completed books, grouped by genre in canonical order', () => {
    const o = overviewOf([read('jn', 1), read('jn', 2), read('gn', 1), read('gn', 1)], books);
    expect(o).toMatchObject({ chaptersRead: 3, chapterCount: 7, percent: 43, booksCompleted: 1, bookCount: 3 });
    expect(o.byGenre.map((g) => [g.genre, g.chaptersRead, g.booksCompleted])).toEqual([
      ['law', 1, 0],
      ['prophets', 2, 1],
      ['gospels', 0, 0],
    ]);
  });

  it('never counts more chapters than a book has', () => {
    const o = overviewOf([read('jn', 1), read('jn', 2), read('jn', 3)], books);
    expect(o.chaptersRead).toBe(2);
  });
});

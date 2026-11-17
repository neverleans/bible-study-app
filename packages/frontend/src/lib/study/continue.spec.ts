import { describe, it, expect } from 'vitest';
import { nextToRead, readCountByBook, type BookRef, type ReadItem } from './continue';

const books: BookRef[] = [
  { abbrev: 'ob', name: 'Obadias', order: 31, chapterCount: 1 },
  { abbrev: 'jn', name: 'Jonas', order: 32, chapterCount: 4 },
  { abbrev: 'mq', name: 'Miqueias', order: 33, chapterCount: 7 },
];

const read = (bookAbbrev: string, chapterNumber: number, minute: number): ReadItem => ({
  bookAbbrev,
  chapterNumber,
  completedAt: `2026-11-16T10:${String(minute).padStart(2, '0')}:00.000Z`,
});

describe('nextToRead', () => {
  it('returns null when nothing was read', () => {
    expect(nextToRead([], books)).toBeNull();
  });

  it('continues with the chapter after the most recently read one', () => {
    expect(nextToRead([read('jn', 1, 1), read('jn', 2, 2)], books)).toEqual({
      bookAbbrev: 'jn', bookName: 'Jonas', chapterNumber: 3,
    });
  });

  it('uses the most recent read, not the highest chapter', () => {
    // read chapter 3 earlier, then went back to chapter 1: continues after chapter 1, skipping read ones
    expect(nextToRead([read('jn', 3, 1), read('jn', 1, 2)], books)).toMatchObject({ chapterNumber: 2 });
  });

  it('skips chapters that were already read', () => {
    expect(nextToRead([read('jn', 2, 1), read('jn', 1, 2), read('jn', 3, 0)], books)).toMatchObject({
      bookAbbrev: 'jn', chapterNumber: 4,
    });
  });

  it('moves to the first chapter of the next book at the end of a book', () => {
    expect(nextToRead([read('jn', 4, 1)], books)).toEqual({
      bookAbbrev: 'mq', bookName: 'Miqueias', chapterNumber: 1,
    });
  });

  it('returns null at the very end of the last book', () => {
    expect(nextToRead([read('mq', 7, 1)], books)).toBeNull();
  });

  it('ignores progress for books it does not know', () => {
    expect(nextToRead([read('zz', 1, 5)], books)).toBeNull();
  });

  it('matches book abbreviations case-insensitively', () => {
    expect(nextToRead([read('JN', 1, 1)], books)).toMatchObject({ bookAbbrev: 'jn', chapterNumber: 2 });
  });
});

describe('readCountByBook', () => {
  it('counts distinct chapters per book', () => {
    expect(readCountByBook([read('jn', 1, 1), read('jn', 1, 2), read('jn', 2, 3), read('ob', 1, 4)])).toEqual({
      jn: 2,
      ob: 1,
    });
  });
});

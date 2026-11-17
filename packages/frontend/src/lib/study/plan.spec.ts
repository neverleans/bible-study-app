import { describe, it, expect } from 'vitest';
import { chaptersForDay, expectedByDay, flattenChapters, planDay } from './plan';
import type { BookRef } from './continue';

const books: BookRef[] = [
  { abbrev: 'jn', name: 'Jonas', order: 32, chapterCount: 4 },
  { abbrev: 'gn', name: 'Gênesis', order: 1, chapterCount: 3 },
];

describe('flattenChapters', () => {
  it('lists every chapter in canonical order', () => {
    expect(flattenChapters(books).map((c) => `${c.bookAbbrev}${c.chapterNumber}`)).toEqual([
      'gn1', 'gn2', 'gn3', 'jn1', 'jn2', 'jn3', 'jn4',
    ]);
  });
});

describe('chaptersForDay', () => {
  const chapters = flattenChapters(books); // 7 chapters

  it('covers every chapter exactly once across the plan', () => {
    const all = Array.from({ length: 3 }, (_, i) => chaptersForDay(chapters, 3, i + 1)).flat();
    expect(all).toEqual(chapters);
  });

  it('spreads the remainder instead of piling it on one day', () => {
    expect([1, 2, 3].map((d) => chaptersForDay(chapters, 3, d).length)).toEqual([2, 2, 3]);
  });

  it('is empty outside the plan', () => {
    expect(chaptersForDay(chapters, 3, 0)).toEqual([]);
    expect(chaptersForDay(chapters, 3, 4)).toEqual([]);
  });

  it('covers the real Bible size in 365 days with no gaps', () => {
    const real = Array.from({ length: 1189 }, (_, i) => ({ bookAbbrev: 'x', bookName: 'X', chapterNumber: i + 1 }));
    const total = Array.from({ length: 365 }, (_, i) => chaptersForDay(real, 365, i + 1).length);
    expect(total.reduce((a, b) => a + b, 0)).toBe(1189);
    expect(Math.min(...total)).toBeGreaterThanOrEqual(3);
  });
});

describe('expectedByDay', () => {
  it('matches the chapters scheduled up to that day', () => {
    expect(expectedByDay(7, 3, 0)).toBe(0);
    expect(expectedByDay(7, 3, 2)).toBe(4);
    expect(expectedByDay(7, 3, 3)).toBe(7);
    expect(expectedByDay(7, 3, 99)).toBe(7);
  });
});

describe('planDay', () => {
  it('is 1 on the start date and counts calendar days', () => {
    expect(planDay('2026-11-01', '2026-11-01')).toBe(1);
    expect(planDay('2026-11-01', '2026-11-10')).toBe(10);
  });

  it('is 0 or negative before the start and 0 for invalid dates', () => {
    expect(planDay('2026-11-10', '2026-11-09')).toBe(0);
    expect(planDay('nope', '2026-11-09')).toBe(0);
  });
});

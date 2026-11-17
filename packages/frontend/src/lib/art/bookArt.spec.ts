import { describe, it, expect } from 'vitest';
import { buildBookCardSvg, genreOf, PALETTES, type BookCardInput, type Genre } from './bookArt';

const base: BookCardInput = {
  order: 32,
  name: 'Jonas',
  chaptersRead: 4,
  chapterCount: 4,
  quizAveragePercent: 80,
  reflectionCount: 2,
  highlightCount: 7,
};

describe('genreOf', () => {
  it.each([
    [1, 'law'], [5, 'law'], [6, 'history'], [17, 'history'], [18, 'wisdom'], [22, 'wisdom'],
    [23, 'prophets'], [39, 'prophets'], [40, 'gospels'], [43, 'gospels'], [44, 'history'],
    [45, 'epistles'], [65, 'epistles'], [66, 'apocalypse'],
  ] as [number, Genre][])('book %i is %s', (order, genre) => {
    expect(genreOf(order)).toBe(genre);
  });
});

describe('buildBookCardSvg', () => {
  it('is deterministic: the same book always gets the same card', () => {
    expect(buildBookCardSvg(base)).toBe(buildBookCardSvg({ ...base }));
  });

  it('gives different books different patterns', () => {
    expect(buildBookCardSvg({ ...base, order: 31 })).not.toBe(buildBookCardSvg({ ...base, order: 32 }));
  });

  it('renders a well-formed card for all 66 books', () => {
    for (let order = 1; order <= 66; order++) {
      const svg = buildBookCardSvg({ ...base, order });
      expect(svg.startsWith('<svg ')).toBe(true);
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
      // Every opened tag is either self-closed or closed: a cheap well-formedness check.
      const opens = (svg.match(/<(g|text|defs|linearGradient)\b/g) ?? []).length;
      const closes = (svg.match(/<\/(g|text|defs|linearGradient)>/g) ?? []).length;
      expect(opens).toBe(closes);
    }
  });

  it('uses a distinct palette for each genre', () => {
    const colors = Object.values(PALETTES).map((p) => p.from);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('marks a finished book as completed and an unfinished one as in progress', () => {
    expect(buildBookCardSvg(base)).toContain('CONCLUÍDO');
    const partial = buildBookCardSvg({ ...base, chaptersRead: 2 });
    expect(partial).toContain('EM ANDAMENTO · 2/4');
    expect(partial).not.toContain('CONCLUÍDO');
  });

  it('shows a dash instead of a score when no quiz was taken', () => {
    expect(buildBookCardSvg({ ...base, quizAveragePercent: null })).toContain('>—<');
  });

  it('escapes text so a book name cannot break the markup', () => {
    const svg = buildBookCardSvg({ ...base, name: 'A&B <script>"x"' });
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('A&amp;B &lt;script&gt;&quot;x&quot;');
  });
});

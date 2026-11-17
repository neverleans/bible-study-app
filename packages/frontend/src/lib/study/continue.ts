/**
 * "Continue studying": where to resume reading, from the chapters already marked as read.
 * Pure so it can be tested without a browser or an API.
 */

export interface BookRef {
  abbrev: string;
  name: string;
  order: number;
  chapterCount: number;
}

export interface ReadItem {
  bookAbbrev: string;
  chapterNumber: number;
  completedAt: string;
}

export interface NextChapter {
  bookAbbrev: string;
  bookName: string;
  chapterNumber: number;
}

/** Chapters read per book (distinct chapters, so re-reading does not inflate the count). */
export function readCountByBook(progress: ReadItem[]): Record<string, number> {
  const seen = new Map<string, Set<number>>();
  for (const p of progress) {
    const key = p.bookAbbrev.toLowerCase();
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key)!.add(p.chapterNumber);
  }
  return Object.fromEntries([...seen].map(([book, chapters]) => [book, chapters.size]));
}

/**
 * The first unread chapter after the most recently read one, in canonical order. Wraps from the
 * end of one book to the start of the next; returns null when nothing was read yet or when
 * everything after the last read chapter is already read.
 */
export function nextToRead(progress: ReadItem[], books: BookRef[]): NextChapter | null {
  if (progress.length === 0 || books.length === 0) return null;

  const byAbbrev = new Map(books.map((b) => [b.abbrev.toLowerCase(), b]));
  const read = new Set(progress.map((p) => `${p.bookAbbrev.toLowerCase()}:${p.chapterNumber}`));

  const last = [...progress]
    .filter((p) => byAbbrev.has(p.bookAbbrev.toLowerCase()))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  if (!last) return null;

  const ordered = [...books].sort((a, b) => a.order - b.order);
  const startBook = ordered.findIndex((b) => b.abbrev.toLowerCase() === last.bookAbbrev.toLowerCase());

  for (let i = startBook; i < ordered.length; i++) {
    const book = ordered[i];
    const firstChapter = i === startBook ? last.chapterNumber + 1 : 1;
    for (let ch = firstChapter; ch <= book.chapterCount; ch++) {
      if (!read.has(`${book.abbrev.toLowerCase()}:${ch}`)) {
        return { bookAbbrev: book.abbrev, bookName: book.name, chapterNumber: ch };
      }
    }
  }
  return null;
}

/**
 * Whole-Bible reading overview, by genre. Pure so it can be tested without a browser.
 */
import { GENRE_LABEL, genreOf, type Genre } from '$lib/art/bookArt';
import { readCountByBook, type BookRef, type ReadItem } from './continue';

export interface GenreProgress {
  genre: Genre;
  label: string;
  chaptersRead: number;
  chapterCount: number;
  booksCompleted: number;
  bookCount: number;
}

export interface Overview {
  chaptersRead: number;
  chapterCount: number;
  percent: number;
  booksCompleted: number;
  bookCount: number;
  byGenre: GenreProgress[];
}

export function overviewOf(progress: ReadItem[], books: BookRef[]): Overview {
  const reads = readCountByBook(progress);
  const groups = new Map<Genre, GenreProgress>();
  let chaptersRead = 0;
  let chapterCount = 0;
  let booksCompleted = 0;

  for (const book of [...books].sort((a, b) => a.order - b.order)) {
    const genre = genreOf(book.order);
    const group =
      groups.get(genre) ??
      { genre, label: GENRE_LABEL[genre], chaptersRead: 0, chapterCount: 0, booksCompleted: 0, bookCount: 0 };
    // Never count more than the book has, even if stale progress mentions a chapter that no longer exists.
    const read = Math.min(reads[book.abbrev.toLowerCase()] ?? 0, book.chapterCount);
    const done = book.chapterCount > 0 && read >= book.chapterCount;

    group.chaptersRead += read;
    group.chapterCount += book.chapterCount;
    group.bookCount += 1;
    if (done) group.booksCompleted += 1;
    groups.set(genre, group);

    chaptersRead += read;
    chapterCount += book.chapterCount;
    booksCompleted += done ? 1 : 0;
  }

  return {
    chaptersRead,
    chapterCount,
    percent: chapterCount === 0 ? 0 : Math.round((chaptersRead / chapterCount) * 100),
    booksCompleted,
    bookCount: books.length,
    byGenre: [...groups.values()],
  };
}

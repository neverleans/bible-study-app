export interface Book {
  id: number;
  abbrev: string;
  name: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
  order: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface ChapterNavigation {
  bookAbbrev: string;
  chapterNumber: number;
}

export interface ChapterResponse {
  book: Book;
  number: number;
  verses: Verse[];
  prevChapter: ChapterNavigation | null;
  nextChapter: ChapterNavigation | null;
}

export interface HealthResponse {
  status: string;
  info: Record<string, unknown>;
}

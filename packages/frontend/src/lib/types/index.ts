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

export interface SearchResultItem {
  verseId: number;
  bookName: string;
  bookAbbrev: string;
  testament: string;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  highlight: string;
}

export interface SearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: SearchResultItem[];
}

export interface SearchParams {
  q: string;
  page?: number;
  limit?: number;
  testament?: 'OT' | 'NT';
  book?: string;
}

export interface HealthResponse {
  status: string;
  info: Record<string, unknown>;
}

export interface Note {
  id: string;
  userId: string;
  bookAbbrev: string;
  bookName: string;
  chapterNumber: number;
  verseNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  bookAbbrev: string;
  chapterNumber: number;
  verseNumber: number;
  content: string;
}

export interface UpdateNotePayload {
  content: string;
}

export interface GetNotesParams {
  book?: string;
  chapter?: number;
  verse?: number;
}


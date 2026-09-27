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

export interface LiterarySection {
  section: string;
  verses: string;
  description: string;
}

export interface ChapterAnalysisResult {
  bookName: string;
  chapterNumber: number;
  title: string;
  summary: string;
  historicalContext: string;
  keyThemes: string[];
  literaryStructure: LiterarySection[];
  practicalApplication: string[];
  theologicalInsights: string;
}

export interface BookOutlineSection {
  section: string;
  chapters: string;
  summary: string;
}

export interface KeyVerse {
  reference: string;
  text: string;
  commentary: string;
}

export interface BookReflectionResult {
  bookName: string;
  testament: 'OT' | 'NT';
  author: string;
  dateAndContext: string;
  purpose: string;
  centralTheme: string;
  structureOutline: BookOutlineSection[];
  keyVerses: KeyVerse[];
  christologicalSignificance: string;
}

export interface AiStatusResponse<T = ChapterAnalysisResult | BookReflectionResult> {
  status: 'completed' | 'queued' | 'active' | 'waiting' | 'failed';
  jobId?: string;
  cached?: boolean;
  data?: T;
  error?: string;
}

export interface StudyAidMetadata {
  chapterNumber?: number;
  verseNumber?: number;
  reference?: string;
  commentary?: string;
  title?: string;
  author?: string;
  date?: string;
  audience?: string;
  keyThemes?: string[];
  sourceReference?: string;
  targetBookAbbrev?: string;
  targetBookName?: string;
  targetChapter?: number;
  targetVerse?: number;
  targetReference?: string;
  [key: string]: unknown;
}

export interface StudyAid {
  id: number;
  bookId: number;
  bookAbbrev: string;
  bookName: string;
  type: 'summary' | 'key_verse' | 'cross_ref' | 'context' | string;
  content: string;
  metadata: StudyAidMetadata;
  createdAt: string;
}




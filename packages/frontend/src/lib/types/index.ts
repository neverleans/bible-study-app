/**
 * Frontend types.
 *
 * Everything the API returns or accepts is derived from `$api/schema` (generated from the
 * OpenAPI contract with `pnpm --filter @biblia/frontend gen:api`), so a DTO change on the API
 * is a type error here instead of a runtime surprise. Only shapes the contract does not
 * describe (query params, AI payloads, UI-only types) are written by hand below.
 */
import type { components } from '$api/schema';

type Schemas = components['schemas'];

// ---------------------------------------------------------------------------
// Generated from the API contract
// ---------------------------------------------------------------------------
export type Book = Schemas['BookResponseDto'];
export type Verse = Schemas['VerseDto'];
export type ChapterNavigation = Schemas['ChapterNavigationDto'];
export type ChapterResponse = Schemas['ChapterResponseDto'];
export type SearchResultItem = Schemas['SearchResultItemDto'];
export type SearchResponse = Schemas['SearchResponseDto'];

export type Note = Schemas['NoteResponseDto'];
export type CreateNotePayload = Schemas['CreateNoteDto'];
export type UpdateNotePayload = Schemas['UpdateNoteDto'];

export type Highlight = Schemas['HighlightResponseDto'];
export type HighlightColor = Highlight['color'];
export type UpsertHighlightPayload = Schemas['UpsertHighlightDto'];
export type ReadingProgressItem = Schemas['ProgressResponseDto'];

export type OriginalWord = Schemas['OriginalWordDto'];
export type ChapterOriginal = Schemas['ChapterOriginalDto'];
export type LexiconEntry = Schemas['LexiconEntryDto'];

export type ChapterQuizStatus = Schemas['ChapterQuizStatusDto'];
export type QuizAttemptResult = Schemas['AttemptResultDto'];

export type ReviewCard = Schemas['ReviewCardDto'];
export type DueCards = Schemas['DueCardsDto'];
export type ReviewSummary = Schemas['ReviewSummaryDto'];
export type ReviewGrade = Schemas['GradeCardDto']['grade'];

export type Reflection = Schemas['ReflectionDto'];

export type User = Schemas['UserProfileDto'];
export type AuthResponse = Schemas['AuthResponseDto'];
export type AccessTokenResponse = Schemas['AccessTokenResponseDto'];

// ---------------------------------------------------------------------------
// Study aids: the contract types `metadata` as an open object; the UI reads known keys.
// ---------------------------------------------------------------------------
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

export type StudyAid = Omit<Schemas['StudyAidResponseDto'], 'metadata'> & {
  metadata: StudyAidMetadata;
};

// ---------------------------------------------------------------------------
// Hand-written: request params and shapes outside the contract
// ---------------------------------------------------------------------------
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

export interface GetNotesParams {
  book?: string;
  chapter?: number;
  verse?: number;
}

export interface GuestNote extends Note {
  isGuest?: boolean;
}

// AI results: the API documents `data` as an open object, so these stay hand-written.
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

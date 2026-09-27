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

export type AiAnalysisData = ChapterAnalysisResult | BookReflectionResult;

export interface AiStatusResponse {
  status: 'completed' | 'queued' | 'active' | 'waiting' | 'failed';
  jobId?: string;
  cached?: boolean;
  data?: AiAnalysisData;
  error?: string;
}

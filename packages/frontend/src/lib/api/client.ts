import type {
  Book,
  ChapterResponse,
  SearchParams,
  SearchResponse,
  Note,
  CreateNotePayload,
  UpdateNotePayload,
  GetNotesParams,
  ChapterAnalysisResult,
  BookReflectionResult,
  AiStatusResponse,
  StudyAid,
  User,
  AuthResponse,
} from '$types';
import { getCurrentUserId } from '$stores/user';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': getCurrentUserId(),
      ...customHeaders,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('biblia_access_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponseError(res: Response): Promise<never> {
    let errMessage = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      if (errorBody?.message) {
        errMessage = Array.isArray(errorBody.message)
          ? errorBody.message.join(', ')
          : errorBody.message;
      }
    } catch {
      // Keep default message
    }
    throw new Error(errMessage);
  }

  async get<T>(path: string, customHeaders?: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.getHeaders(customHeaders),
    });
    if (!res.ok) {
      await this.handleResponseError(res);
    }
    return res.json();
  }

  async post<T>(path: string, body: unknown, customHeaders?: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      await this.handleResponseError(res);
    }
    return res.json();
  }

  async put<T>(path: string, body: unknown, customHeaders?: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      await this.handleResponseError(res);
    }
    return res.json();
  }

  async delete<T = { success: boolean }>(path: string, customHeaders?: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(customHeaders),
    });
    if (!res.ok) {
      await this.handleResponseError(res);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return res.json();
    }
    return { success: true } as unknown as T;
  }

  // Bible Endpoints
  async getBooks(testament?: 'OT' | 'NT'): Promise<Book[]> {
    const query = testament ? `?testament=${testament}` : '';
    return this.get<Book[]>(`/bible/books${query}`);
  }

  async getBook(abbrev: string): Promise<Book> {
    return this.get<Book>(`/bible/books/${abbrev}`);
  }

  async getChapter(abbrev: string, chapterNumber: number): Promise<ChapterResponse> {
    return this.get<ChapterResponse>(`/bible/books/${abbrev}/chapters/${chapterNumber}`);
  }

  // Search Endpoint
  async search(params: SearchParams): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('q', params.q);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.testament) searchParams.set('testament', params.testament);
    if (params.book) searchParams.set('book', params.book);

    return this.get<SearchResponse>(`/search?${searchParams.toString()}`);
  }

  // Notes Endpoints (Protected by PostgreSQL RLS)
  async getNotes(params?: GetNotesParams): Promise<Note[]> {
    const searchParams = new URLSearchParams();
    if (params?.book) searchParams.set('book', params.book);
    if (params?.chapter) searchParams.set('chapter', params.chapter.toString());
    if (params?.verse) searchParams.set('verse', params.verse.toString());

    const queryString = searchParams.toString();
    const path = queryString ? `/notes?${queryString}` : '/notes';
    return this.get<Note[]>(path);
  }

  async createNote(data: CreateNotePayload): Promise<Note> {
    return this.post<Note>('/notes', data);
  }

  async updateNote(id: string, data: UpdateNotePayload): Promise<Note> {
    return this.put<Note>(`/notes/${id}`, data);
  }

  async deleteNote(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/notes/${id}`);
  }

  // AI Endpoints
  async analyzeChapter(bookAbbrev: string, chapterNumber: number): Promise<AiStatusResponse<ChapterAnalysisResult>> {
    return this.post<AiStatusResponse<ChapterAnalysisResult>>('/ai/chapter', {
      bookAbbrev,
      chapterNumber,
    });
  }

  async reflectBook(bookAbbrev: string): Promise<AiStatusResponse<BookReflectionResult>> {
    return this.post<AiStatusResponse<BookReflectionResult>>('/ai/book', {
      bookAbbrev,
    });
  }

  async getAiStatus<T = ChapterAnalysisResult | BookReflectionResult>(jobId: string): Promise<AiStatusResponse<T>> {
    return this.get<AiStatusResponse<T>>(`/ai/status/${jobId}`);
  }

  async pollAiJob<T = ChapterAnalysisResult | BookReflectionResult>(
    jobId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 30,
    intervalMs: number = 1500,
  ): Promise<AiStatusResponse<T>> {
    for (let i = 0; i < maxAttempts; i++) {
      const res = await this.getAiStatus<T>(jobId);
      onProgress?.(res.status);
      if (res.status === 'completed' || res.status === 'failed') {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Tempo limite excedido ao processar a análise com IA.');
  }

  // Study Aids Endpoints
  async getStudyAidsByBook(bookAbbrev: string, type?: string): Promise<StudyAid[]> {
    const query = type ? `?type=${type}` : '';
    return this.get<StudyAid[]>(`/study-aids/book/${bookAbbrev}${query}`);
  }

  async getStudyAidsByChapter(bookAbbrev: string, chapterNumber: number): Promise<StudyAid[]> {
    return this.get<StudyAid[]>(`/study-aids/chapter/${bookAbbrev}/${chapterNumber}`);
  }

  // Auth Endpoints
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', data);
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', data);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
  }

  async getMe(): Promise<User> {
    return this.get<User>('/auth/me');
  }
}

export const api = new ApiClient();


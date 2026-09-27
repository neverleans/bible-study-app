import type { Book, ChapterResponse } from '$types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
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
}

export const api = new ApiClient();

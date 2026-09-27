import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { api } from '$api/client';
import type { User, Note, CreateNotePayload, UpdateNotePayload } from '$types';

const ACCESS_TOKEN_KEY = 'biblia_access_token';
const REFRESH_TOKEN_KEY = 'biblia_refresh_token';
const GUEST_NOTES_KEY = 'biblia_guest_notes';

export const currentUser = writable<User | null>(null);
export const isAuthenticated = derived(currentUser, ($u) => $u !== null);
export const isAuthLoading = writable<boolean>(true);
export const showAuthModal = writable<boolean>(false);
export const authNotification = writable<string | null>(null);

// ----------------------------------------------------
// Token Helpers
// ----------------------------------------------------
export function getStoredAccessToken(): string | null {
  if (browser) {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

export function getStoredRefreshToken(): string | null {
  if (browser) {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  if (browser) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens(): void {
  if (browser) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

// ----------------------------------------------------
// Guest Notes (Local Storage for Unlogged Users)
// ----------------------------------------------------
export function getGuestNotes(filter?: { book?: string; chapter?: number; verse?: number }): Note[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(GUEST_NOTES_KEY);
    if (!raw) return [];
    const allNotes: Note[] = JSON.parse(raw);

    return allNotes.filter((n) => {
      if (filter?.book && n.bookAbbrev.toLowerCase() !== filter.book.toLowerCase()) return false;
      if (filter?.chapter !== undefined && n.chapterNumber !== filter.chapter) return false;
      if (filter?.verse !== undefined && n.verseNumber !== filter.verse) return false;
      return true;
    });
  } catch (err) {
    console.error('Falha ao ler anotações locais do modo visitante:', err);
    return [];
  }
}

export function createGuestNote(payload: CreateNotePayload, bookName: string = ''): Note {
  if (!browser) {
    throw new Error('Não é possível criar notas locais no servidor.');
  }

  const notes = getGuestNotes();
  const newNote: Note = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: 'guest',
    bookAbbrev: payload.bookAbbrev,
    bookName: bookName || payload.bookAbbrev.toUpperCase(),
    chapterNumber: payload.chapterNumber,
    verseNumber: payload.verseNumber,
    content: payload.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.push(newNote);
  localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  return newNote;
}

export function updateGuestNote(id: string, payload: UpdateNotePayload): Note {
  if (!browser) {
    throw new Error('Não é possível atualizar notas locais no servidor.');
  }

  const notes = getGuestNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) {
    throw new Error('Anotação local não encontrada.');
  }

  const updated: Note = {
    ...notes[index],
    content: payload.content,
    updatedAt: new Date().toISOString(),
  };

  notes[index] = updated;
  localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
  return updated;
}

export function deleteGuestNote(id: string): void {
  if (!browser) return;
  const notes = getGuestNotes();
  const filtered = notes.filter((n) => n.id !== id);
  localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(filtered));
}

export async function syncGuestNotesToCloud(): Promise<number> {
  if (!browser) return 0;
  const guestNotes = getGuestNotes();
  if (guestNotes.length === 0) return 0;

  let syncedCount = 0;
  const remainingNotes: Note[] = [];

  for (const note of guestNotes) {
    try {
      await api.createNote({
        bookAbbrev: note.bookAbbrev,
        chapterNumber: note.chapterNumber,
        verseNumber: note.verseNumber,
        content: note.content,
      });
      syncedCount++;
    } catch (err) {
      console.error(`Falha ao sincronizar anotação local ${note.id}:`, err);
      remainingNotes.push(note);
    }
  }

  if (remainingNotes.length > 0) {
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(remainingNotes));
  } else {
    localStorage.removeItem(GUEST_NOTES_KEY);
  }

  return syncedCount;
}

// ----------------------------------------------------
// Authentication Lifecycle
// ----------------------------------------------------
export async function initAuth(): Promise<void> {
  if (!browser) return;

  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (!accessToken && !refreshToken) {
    isAuthLoading.set(false);
    return;
  }

  try {
    if (accessToken) {
      const user = await api.getMe();
      currentUser.set(user);
    }
  } catch {
    // Access token may have expired, try refresh
    if (refreshToken) {
      try {
        const tokens = await api.refreshToken(refreshToken);
        saveTokens(tokens.accessToken, tokens.refreshToken);
        const user = await api.getMe();
        currentUser.set(user);
      } catch {
        clearTokens();
        currentUser.set(null);
      }
    } else {
      clearTokens();
      currentUser.set(null);
    }
  } finally {
    isAuthLoading.set(false);
  }
}

export async function login(email: string, password: string): Promise<{ syncedCount: number }> {
  const res = await api.login({ email, password });
  saveTokens(res.accessToken, res.refreshToken);
  currentUser.set(res.user);

  // Sync any guest notes
  const syncedCount = await syncGuestNotesToCloud();
  if (syncedCount > 0) {
    authNotification.set(
      `🎉 Login realizado! ${syncedCount} anotação(ões) local(is) foram sincronizadas com sua conta na nuvem.`
    );
  }

  return { syncedCount };
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ syncedCount: number }> {
  const res = await api.register({ name, email, password });
  saveTokens(res.accessToken, res.refreshToken);
  currentUser.set(res.user);

  // Sync any guest notes
  const syncedCount = await syncGuestNotesToCloud();
  if (syncedCount > 0) {
    authNotification.set(
      `🎉 Conta criada com sucesso! ${syncedCount} anotação(ões) salva(s) no modo visitante foram vinculadas ao seu perfil com segurança RLS.`
    );
  }

  return { syncedCount };
}

export function logout(): void {
  clearTokens();
  currentUser.set(null);
  authNotification.set('Sessão encerrada. Você agora está no modo visitante.');
}

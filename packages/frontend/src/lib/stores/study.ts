import { browser } from '$app/environment';
import { api } from '$api/client';
import type { Highlight, HighlightColor, UpsertHighlightPayload, ReadingProgressItem } from '$types';

const GUEST_HIGHLIGHTS_KEY = 'biblia_guest_highlights';
const GUEST_PROGRESS_KEY = 'biblia_guest_progress';

/** Semantic colors for the "Observe" step of inductive study. */
export const HIGHLIGHT_META: Record<
  HighlightColor,
  { label: string; hint: string; verse: string; swatch: string }
> = {
  person: {
    label: 'Personagem',
    hint: 'Quem age ou é citado',
    verse: 'bg-sky-100 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800',
    swatch: 'bg-sky-400',
  },
  place: {
    label: 'Lugar',
    hint: 'Onde acontece',
    verse: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800',
    swatch: 'bg-emerald-400',
  },
  repeat: {
    label: 'Repetição',
    hint: 'Palavra ou ideia repetida',
    verse: 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800',
    swatch: 'bg-amber-400',
  },
  promise: {
    label: 'Promessa',
    hint: 'Promessa ou ordem de Deus',
    verse: 'bg-violet-100 dark:bg-violet-950/50 border-violet-300 dark:border-violet-800',
    swatch: 'bg-violet-400',
  },
  sequence: {
    label: 'Sequência',
    hint: 'Ordem dos acontecimentos',
    verse: 'bg-orange-100 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800',
    swatch: 'bg-orange-400',
  },
  contrast: {
    label: 'Contraste',
    hint: 'Comparação ou oposição',
    verse: 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800',
    swatch: 'bg-rose-400',
  },
};

export const HIGHLIGHT_COLORS = Object.keys(HIGHLIGHT_META) as HighlightColor[];

function readLocal<T>(key: string): T[] {
  if (!browser) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (err) {
    console.error(`Falha ao ler ${key} do modo visitante:`, err);
    return [];
  }
}

function writeLocal<T>(key: string, items: T[]): void {
  if (!browser) return;
  try {
    if (items.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error(`Falha ao gravar ${key} do modo visitante:`, err);
  }
}

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------
export function getGuestHighlights(book?: string, chapter?: number): Highlight[] {
  return readLocal<Highlight>(GUEST_HIGHLIGHTS_KEY).filter(
    (h) =>
      (!book || h.bookAbbrev.toLowerCase() === book.toLowerCase()) &&
      (chapter === undefined || h.chapterNumber === chapter),
  );
}

export async function loadHighlights(
  book: string,
  chapter: number,
  authenticated: boolean,
): Promise<Highlight[]> {
  if (!authenticated) return getGuestHighlights(book, chapter);
  try {
    return await api.getHighlights({ book, chapter });
  } catch (err) {
    console.warn('Falha ao carregar destaques da nuvem:', err);
    return [];
  }
}

/** Creates or recolors the highlight of one verse. */
export async function setHighlight(
  payload: UpsertHighlightPayload,
  authenticated: boolean,
): Promise<Highlight> {
  if (authenticated) return api.upsertHighlight(payload);

  const all = readLocal<Highlight>(GUEST_HIGHLIGHTS_KEY);
  const now = new Date().toISOString();
  const idx = all.findIndex(
    (h) =>
      h.bookAbbrev === payload.bookAbbrev &&
      h.chapterNumber === payload.chapterNumber &&
      h.verseNumber === payload.verseNumber,
  );
  let result: Highlight;
  if (idx >= 0) {
    result = { ...all[idx], color: payload.color, updatedAt: now };
    all[idx] = result;
  } else {
    result = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...payload,
      createdAt: now,
      updatedAt: now,
    };
    all.push(result);
  }
  writeLocal(GUEST_HIGHLIGHTS_KEY, all);
  return result;
}

export async function removeHighlight(highlight: Highlight, authenticated: boolean): Promise<void> {
  if (authenticated && !highlight.id.startsWith('guest-')) {
    await api.deleteHighlight(highlight.id);
    return;
  }
  writeLocal(
    GUEST_HIGHLIGHTS_KEY,
    readLocal<Highlight>(GUEST_HIGHLIGHTS_KEY).filter((h) => h.id !== highlight.id),
  );
}

// ---------------------------------------------------------------------------
// Reading progress
// ---------------------------------------------------------------------------
export function getGuestProgress(book?: string): ReadingProgressItem[] {
  return readLocal<ReadingProgressItem>(GUEST_PROGRESS_KEY).filter(
    (p) => !book || p.bookAbbrev.toLowerCase() === book.toLowerCase(),
  );
}

export async function loadReadChapters(book: string, authenticated: boolean): Promise<number[]> {
  if (!authenticated) return getGuestProgress(book).map((p) => p.chapterNumber);
  try {
    return (await api.getProgress(book)).map((p) => p.chapterNumber);
  } catch (err) {
    console.warn('Falha ao carregar progresso da nuvem:', err);
    return [];
  }
}

export async function setChapterRead(
  book: string,
  chapter: number,
  read: boolean,
  authenticated: boolean,
): Promise<void> {
  if (authenticated) {
    if (read) await api.markChapterRead(book, chapter);
    else await api.unmarkChapterRead(book, chapter);
    return;
  }
  const others = readLocal<ReadingProgressItem>(GUEST_PROGRESS_KEY).filter(
    (p) => !(p.bookAbbrev === book && p.chapterNumber === chapter),
  );
  if (read) {
    others.push({ bookAbbrev: book, chapterNumber: chapter, completedAt: new Date().toISOString() });
  }
  writeLocal(GUEST_PROGRESS_KEY, others);
}

// ---------------------------------------------------------------------------
// Guest -> cloud sync (called after login/register, mirrors syncGuestNotesToCloud)
// ---------------------------------------------------------------------------
export async function syncGuestStudyDataToCloud(): Promise<number> {
  if (!browser) return 0;
  let synced = 0;

  const highlights = readLocal<Highlight>(GUEST_HIGHLIGHTS_KEY);
  const failedHighlights: Highlight[] = [];
  for (const h of highlights) {
    try {
      await api.upsertHighlight({
        bookAbbrev: h.bookAbbrev,
        chapterNumber: h.chapterNumber,
        verseNumber: h.verseNumber,
        color: h.color,
      });
      synced++;
    } catch (err) {
      console.error('Falha ao sincronizar destaque local:', err);
      failedHighlights.push(h);
    }
  }
  writeLocal(GUEST_HIGHLIGHTS_KEY, failedHighlights);

  const progress = readLocal<ReadingProgressItem>(GUEST_PROGRESS_KEY);
  const failedProgress: ReadingProgressItem[] = [];
  for (const p of progress) {
    try {
      await api.markChapterRead(p.bookAbbrev, p.chapterNumber);
      synced++;
    } catch (err) {
      console.error('Falha ao sincronizar progresso local:', err);
      failedProgress.push(p);
    }
  }
  writeLocal(GUEST_PROGRESS_KEY, failedProgress);

  return synced;
}

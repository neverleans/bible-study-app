/**
 * Reading plan: the whole Bible in canonical order, spread evenly over N days.
 * Pure (dates come in as arguments) so it can be tested without a clock or a browser.
 */
import type { BookRef } from './continue';

export interface PlanChapter {
  bookAbbrev: string;
  bookName: string;
  chapterNumber: number;
}

export const PLAN_LENGTHS = [365, 180, 90] as const;

export interface StoredPlan {
  days: number;
  /** ISO date (YYYY-MM-DD) of day 1. */
  startedAt: string;
}

/** Every chapter in canonical order. */
export function flattenChapters(books: BookRef[]): PlanChapter[] {
  return [...books]
    .sort((a, b) => a.order - b.order)
    .flatMap((b) =>
      Array.from({ length: b.chapterCount }, (_, i) => ({
        bookAbbrev: b.abbrev,
        bookName: b.name,
        chapterNumber: i + 1,
      })),
    );
}

/** Chapters of a 1-based plan day; spreads the remainder so no day is empty when there are enough chapters. */
export function chaptersForDay(chapters: PlanChapter[], totalDays: number, day: number): PlanChapter[] {
  if (totalDays <= 0 || day < 1 || day > totalDays) return [];
  const n = chapters.length;
  return chapters.slice(Math.floor(((day - 1) * n) / totalDays), Math.floor((day * n) / totalDays));
}

/** How many chapters should be read by the end of the given day. */
export function expectedByDay(chapterCount: number, totalDays: number, day: number): number {
  if (totalDays <= 0) return 0;
  return Math.floor((Math.min(Math.max(day, 0), totalDays) * chapterCount) / totalDays);
}

/** 1-based plan day for a date; 0 when the plan has not started yet. Dates are compared as calendar days. */
export function planDay(startedAt: string, today: string): number {
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startedAt}T00:00:00Z`);
  if (Number.isNaN(ms)) return 0;
  return Math.floor(ms / 86_400_000) + 1;
}

/**
 * SM-2 spaced repetition (SuperMemo 2), simplified to three buttons.
 * Pure and deterministic so it can be unit tested without a database.
 */
export type Grade = 'again' | 'good' | 'easy';

export interface SchedulingState {
  ease: number;
  intervalDays: number;
  repetitions: number;
}

export interface NextSchedule extends SchedulingState {
  dueAt: Date;
}

export const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

// SM-2 quality scores behind each button.
const QUALITY: Record<Grade, number> = { again: 1, good: 4, easy: 5 };

export function nextSchedule(state: SchedulingState, grade: Grade, now: Date): NextSchedule {
  const q = QUALITY[grade];

  // Ease update from the original SM-2 formula, floored at 1.3.
  const ease = Math.max(
    MIN_EASE,
    round2(state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))),
  );

  if (grade === 'again') {
    // Lapse: start over, see it again tomorrow.
    return { ease, intervalDays: 1, repetitions: 0, dueAt: addDays(now, 1) };
  }

  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(Math.max(1, state.intervalDays) * ease);

  return { ease, intervalDays, repetitions, dueAt: addDays(now, intervalDays) };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

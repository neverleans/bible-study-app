import { nextSchedule, MIN_EASE, SchedulingState } from './sm2';

const NOW = new Date('2026-11-16T12:00:00.000Z');
const fresh: SchedulingState = { ease: 2.5, intervalDays: 0, repetitions: 0 };
const days = (d: Date) => Math.round((d.getTime() - NOW.getTime()) / 86_400_000);

describe('nextSchedule (SM-2)', () => {
  it('schedules a first good review for tomorrow, then 6 days, then grows by ease', () => {
    const first = nextSchedule(fresh, 'good', NOW);
    expect(first).toMatchObject({ intervalDays: 1, repetitions: 1, ease: 2.5 });
    expect(days(first.dueAt)).toBe(1);

    const second = nextSchedule(first, 'good', NOW);
    expect(second).toMatchObject({ intervalDays: 6, repetitions: 2 });

    const third = nextSchedule(second, 'good', NOW);
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBe(15); // round(6 * 2.5)
  });

  it('raises ease on easy and lowers it on again', () => {
    expect(nextSchedule(fresh, 'easy', NOW).ease).toBe(2.6);
    // quality 1: 0.1 - 4 * (0.08 + 4 * 0.02) = -0.54
    expect(nextSchedule(fresh, 'again', NOW).ease).toBe(1.96);
  });

  it('resets repetitions and returns tomorrow after a lapse', () => {
    const veteran: SchedulingState = { ease: 2.5, intervalDays: 30, repetitions: 5 };
    const lapsed = nextSchedule(veteran, 'again', NOW);
    expect(lapsed).toMatchObject({ repetitions: 0, intervalDays: 1 });
    expect(days(lapsed.dueAt)).toBe(1);
  });

  it('never lets ease fall below the SM-2 floor', () => {
    let state: SchedulingState = { ease: 1.35, intervalDays: 1, repetitions: 1 };
    for (let i = 0; i < 5; i++) state = nextSchedule(state, 'again', NOW);
    expect(state.ease).toBe(MIN_EASE);
  });

  it('is deterministic for the same input', () => {
    expect(nextSchedule(fresh, 'good', NOW)).toEqual(nextSchedule(fresh, 'good', NOW));
  });
});

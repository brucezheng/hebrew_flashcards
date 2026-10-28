import { describe, expect, it } from 'vitest';
import { INTERVAL_DAYS, MAX_BOX, answer, planSession, schedule, startSession } from './srs';

const NOW = new Date(2026, 0, 10, 15, 30).getTime();
const DAY = 86_400_000;
const morning = new Date(2026, 0, 10).getTime();

describe('schedule', () => {
  it('new card: Good → box 1, due tomorrow morning; Easy → box 2', () => {
    expect(schedule(undefined, 'good', NOW)).toMatchObject({ box: 1, due: morning + DAY, reps: 1, lapses: 0 });
    expect(schedule(undefined, 'easy', NOW)).toMatchObject({ box: 2, due: morning + INTERVAL_DAYS[2] * DAY });
  });

  it('Again resets to box 0, due now, and counts a lapse for seen cards', () => {
    const s = schedule({ box: 3, due: NOW - DAY, reps: 4, lapses: 0 }, 'again', NOW);
    expect(s).toEqual({ box: 0, due: NOW, reps: 5, lapses: 1 });
    expect(schedule(undefined, 'again', NOW).lapses).toBe(0);
  });

  it('caps at the top box', () => {
    expect(schedule({ box: MAX_BOX, due: NOW, reps: 9, lapses: 0 }, 'easy', NOW).box).toBe(MAX_BOX);
  });
});

describe('planSession', () => {
  it('takes due cards plus a capped number of new cards', () => {
    const progress = {
      a: { box: 1, due: NOW - 1, reps: 1, lapses: 0 },
      b: { box: 2, due: NOW + DAY, reps: 1, lapses: 0 },
    };
    const plan = planSession(['a', 'b', 'c', 'd', 'e'], progress, 2, NOW);
    expect(plan).toEqual({ due: ['a'], fresh: ['c', 'd'] });
  });
});

describe('session queue', () => {
  it('a missed card comes back a few cards later', () => {
    let s = startSession(['a', 'b', 'c', 'd', 'e']);
    s = answer(s, 'again');
    expect(s.queue).toEqual(['b', 'c', 'd', 'a', 'e']);
    s = answer(answer(answer(s, 'good'), 'good'), 'good');
    expect(s.queue).toEqual(['a', 'e']);
    expect(s).toMatchObject({ answered: 4, completed: 3, missed: 1 });
  });

  it('near the end, a missed card goes to the back; the session ends when the queue empties', () => {
    let s = startSession(['a', 'b']);
    s = answer(s, 'again');
    expect(s.queue).toEqual(['b', 'a']);
    s = answer(answer(s, 'good'), 'easy');
    expect(s.queue).toEqual([]);
    expect(answer(s, 'good')).toBe(s);
  });
});

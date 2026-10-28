// Leitner-box spaced repetition and study-session queues.

export type Grade = 'again' | 'good' | 'easy';

export interface CardState {
  /** 0 = learning (due again soon), up to MAX_BOX. */
  box: number;
  /** Epoch ms when the card is next due. */
  due: number;
  reps: number;
  lapses: number;
}

export type Progress = Record<string, CardState>;

/** Days until next review, per box. */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = INTERVAL_DAYS.length - 1;
/** A missed card comes back after this many other cards. */
export const REQUEUE_GAP = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function schedule(state: CardState | undefined, grade: Grade, now: number): CardState {
  const prev = state ?? { box: 0, due: now, reps: 0, lapses: 0 };
  if (grade === 'again') {
    return { box: 0, due: now, reps: prev.reps + 1, lapses: prev.lapses + (state ? 1 : 0) };
  }
  const box = Math.min(MAX_BOX, prev.box + (grade === 'easy' ? 2 : 1));
  // Due at the start of the target day, so "tomorrow" means tomorrow morning.
  return { box, due: startOfDay(now) + INTERVAL_DAYS[box] * DAY_MS, reps: prev.reps + 1, lapses: prev.lapses };
}

export function isNew(id: string, progress: Progress): boolean {
  return !progress[id];
}

export function isDue(id: string, progress: Progress, now: number): boolean {
  const s = progress[id];
  return !!s && s.due <= now;
}

export interface SessionPlan {
  due: string[];
  fresh: string[];
}

/** Cards due now, plus up to `newLimit` unseen cards (in deck order). */
export function planSession(ids: string[], progress: Progress, newLimit: number, now: number): SessionPlan {
  const due = ids.filter((id) => isDue(id, progress, now)).sort((a, b) => progress[a].due - progress[b].due);
  const fresh = ids.filter((id) => isNew(id, progress)).slice(0, Math.max(0, newLimit));
  return { due, fresh };
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SessionState {
  /** Card IDs still to show; queue[0] is the current card. */
  queue: string[];
  /** Number of answers given. */
  answered: number;
  /** Distinct cards finished (graded Good/Easy). */
  completed: number;
  /** Times Again was pressed. */
  missed: number;
  total: number;
}

export function startSession(queue: string[]): SessionState {
  return { queue, answered: 0, completed: 0, missed: 0, total: queue.length };
}

/** Advance the queue. Again re-inserts the card REQUEUE_GAP cards later. */
export function answer(session: SessionState, grade: Grade): SessionState {
  const [current, ...rest] = session.queue;
  if (current === undefined) return session;
  if (grade === 'again') {
    const at = Math.min(REQUEUE_GAP, rest.length);
    return {
      ...session,
      queue: [...rest.slice(0, at), current, ...rest.slice(at)],
      answered: session.answered + 1,
      missed: session.missed + 1,
    };
  }
  return { ...session, queue: rest, answered: session.answered + 1, completed: session.completed + 1 };
}

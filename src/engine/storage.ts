// Progress and settings in localStorage. All access is guarded: storage can be
// unavailable (private mode, blocked site data) and the app must still work.

import type { Progress } from './srs';

const KEY = 'hebrew-flashcards:v1';

export interface Settings {
  newPerSession: number;
  /** Speech rate for synthesized audio. */
  speechRate: number;
  autoPlay: boolean;
}

export const DEFAULT_SETTINGS: Settings = { newPerSession: 10, speechRate: 0.8, autoPlay: false };

export interface SavedState {
  progress: Progress;
  settings: Settings;
}

export function loadState(): SavedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedState>;
      return {
        progress: parsed.progress ?? {},
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    }
  } catch {
    // fall through to defaults
  }
  return { progress: {}, settings: { ...DEFAULT_SETTINGS } };
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // not persisted; the session still works in memory
  }
}

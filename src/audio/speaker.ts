// Audio for Hebrew forms.
//
// 1. If public/audio/manifest.json maps the pointed form (NFC) to a file, play
//    that file from public/audio/.
// 2. Otherwise use the browser's speech synthesis with a Hebrew (he-IL) voice.
//
// Chrome pitfalls handled here:
// - An utterance that nothing references can be garbage-collected mid-queue;
//   its events never fire and the synthesis queue hangs. We keep every live
//   utterance in `live` until it ends or errors.
// - speak() issued immediately after cancel() can be silently dropped. After a
//   cancel we wait briefly before speaking, and a watchdog resets the queue and
//   retries once if the utterance never starts.

import { nfc } from '../engine/hebrew';

export interface SpeechLogEntry {
  t: number;
  type: 'request' | 'file' | 'tts' | 'start' | 'end' | 'error' | 'watchdog' | 'unavailable';
  text: string;
  detail?: string;
}

const AFTER_CANCEL_DELAY_MS = 150;
const WATCHDOG_MS = 2500;
const VOICE_POLL_MS = 250;
const VOICE_POLL_LIMIT = 20;

function isHebrewVoice(v: SpeechSynthesisVoice): boolean {
  const lang = v.lang.toLowerCase().replace('_', '-');
  return lang.startsWith('he') || lang.startsWith('iw');
}

export class Speaker {
  rate = 0.8;
  /** True after speech failed to start even after a retry; cleared when speech starts again. */
  stalled = false;
  readonly log: SpeechLogEntry[] = [];

  private synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private voice: SpeechSynthesisVoice | null = null;
  private manifest = new Map<string, string>();
  private listeners = new Set<() => void>();
  private live = new Set<SpeechSynthesisUtterance>();
  private audio: HTMLAudioElement | null = null;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private generation = 0;
  private version = 0;

  init(): void {
    if (this.synth) {
      const synth = this.synth;
      this.loadVoices();
      synth.addEventListener('voiceschanged', () => this.loadVoices());
      // Some browsers never fire voiceschanged; poll for a few seconds.
      let polls = 0;
      const poll = setInterval(() => {
        if (this.voice || ++polls > VOICE_POLL_LIMIT) clearInterval(poll);
        else this.loadVoices();
      }, VOICE_POLL_MS);
    }
    fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: Record<string, string>) => {
        for (const [form, file] of Object.entries(json)) this.manifest.set(nfc(form), file);
        this.notify();
      })
      .catch(() => {
        // no manifest: speech synthesis only
      });
  }

  /** For useSyncExternalStore. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  get voiceName(): string | null {
    return this.voice ? `${this.voice.name} (${this.voice.lang})` : null;
  }

  get hasVoice(): boolean {
    return this.voice !== null;
  }

  hasFile(text: string): boolean {
    return this.manifest.has(nfc(text));
  }

  canPlay(text: string): boolean {
    return this.hasFile(text) || this.hasVoice;
  }

  speak(text: string): void {
    const key = nfc(text);
    const wasBusy = this.stop();
    const gen = this.generation;
    this.record('request', key);
    const file = this.manifest.get(key);
    if (file) this.playFile(file, key, gen, wasBusy);
    else this.speakTts(key, gen, wasBusy, 0);
  }

  /** Stop whatever is playing. Returns true if something was cancelled. */
  stop(): boolean {
    this.generation++;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    let busy = false;
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
      busy = true;
    }
    if (this.synth && (this.synth.speaking || this.synth.pending || this.live.size > 0)) {
      this.synth.cancel();
      busy = true;
    }
    return busy;
  }

  private playFile(file: string, text: string, gen: number, wasBusy: boolean): void {
    this.record('file', text, file);
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/${file}`);
    this.audio = audio;
    const fallback = (why: string) => {
      if (gen !== this.generation) return;
      this.record('error', text, `audio file failed (${why}); using speech synthesis`);
      this.audio = null;
      this.speakTts(text, gen, wasBusy, 0);
    };
    audio.addEventListener('playing', () => this.record('start', text, file));
    audio.addEventListener('ended', () => this.record('end', text, file));
    audio.addEventListener('error', () => fallback('load error'));
    audio.play().catch((e: unknown) => fallback(String(e)));
  }

  private speakTts(text: string, gen: number, afterCancel: boolean, attempt: number): void {
    const synth = this.synth;
    const voice = this.voice;
    if (!synth || !voice) {
      this.record('unavailable', text, 'no Hebrew voice');
      return;
    }
    const go = () => {
      if (gen !== this.generation) return;
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = this.rate;
      this.live.add(u);
      let started = false;
      const watchdog = this.later(WATCHDOG_MS, () => {
        if (started || gen !== this.generation) return;
        this.record('watchdog', text, `no start after ${WATCHDOG_MS}ms (attempt ${attempt + 1})`);
        this.live.delete(u);
        synth.cancel();
        if (attempt < 1) this.speakTts(text, gen, true, attempt + 1);
        else this.setStalled(true);
      });
      u.onstart = () => {
        started = true;
        this.setStalled(false);
        this.record('start', text);
      };
      u.onend = () => {
        this.live.delete(u);
        this.clear(watchdog);
        this.record('end', text);
      };
      u.onerror = (e) => {
        this.live.delete(u);
        this.clear(watchdog);
        this.record('error', text, e.error);
      };
      if (synth.paused) synth.resume();
      this.record('tts', text, attempt ? `retry ${attempt}` : undefined);
      synth.speak(u);
    };
    // Speak synchronously when idle (keeps the user-gesture context that iOS
    // Safari requires); after a cancel, give Chrome a moment first.
    if (afterCancel) this.later(AFTER_CANCEL_DELAY_MS, go);
    else go();
  }

  private loadVoices(): void {
    if (!this.synth) return;
    const hebrew = this.synth.getVoices().filter(isHebrewVoice);
    const best =
      hebrew.find((v) => v.lang.replace('_', '-') === 'he-IL' && v.localService) ??
      hebrew.find((v) => v.localService) ??
      hebrew[0] ??
      null;
    if (best?.voiceURI !== this.voice?.voiceURI) {
      this.voice = best;
      this.notify();
    }
  }

  private setStalled(stalled: boolean): void {
    if (this.stalled === stalled) return;
    this.stalled = stalled;
    this.notify();
  }

  private later(ms: number, fn: () => void): ReturnType<typeof setTimeout> {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
    return t;
  }

  private clear(t: ReturnType<typeof setTimeout>): void {
    clearTimeout(t);
    this.timers.delete(t);
  }

  private record(type: SpeechLogEntry['type'], text: string, detail?: string): void {
    this.log.push({ t: Date.now(), type, text, detail });
    if (this.log.length > 200) this.log.shift();
  }

  private notify(): void {
    this.version++;
    for (const l of this.listeners) l();
  }
}

export const speaker = new Speaker();

import type { ReactNode } from 'react';
import { useSpeaker } from '../audio/useSpeaker';

export function He({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span lang="he" dir="rtl" className={`he ${className}`}>
      {children}
    </span>
  );
}

/** A Hebrew word you can click to hear. */
export function SpokenWord({ text, className = '' }: { text: string; className?: string }) {
  const speaker = useSpeaker();
  const playable = speaker.canPlay(text);
  return (
    <button
      type="button"
      lang="he"
      dir="rtl"
      className={`he spoken ${className}`}
      disabled={!playable}
      title={playable ? 'Play audio' : 'No Hebrew voice available'}
      onClick={() => speaker.speak(text)}
    >
      {text}
    </button>
  );
}

export function PlayButton({ text, label = 'Play audio' }: { text: string; label?: string }) {
  const speaker = useSpeaker();
  const playable = speaker.canPlay(text);
  return (
    <button
      type="button"
      className="play"
      disabled={!playable}
      aria-label={label}
      title={playable ? `${label} (S)` : 'No Hebrew voice available'}
      onClick={() => speaker.speak(text)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path
          d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

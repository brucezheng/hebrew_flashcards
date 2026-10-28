import { useEffect, useMemo, useState } from 'react';
import { speaker } from '../audio/speaker';
import type { Card, Deck } from '../engine/decks';
import { answer, startSession, type Grade } from '../engine/srs';
import { CardView } from './CardView';

export type StudyMode = 'study' | 'practice';

interface Props {
  deck: Deck;
  queue: string[];
  mode: StudyMode;
  autoPlay: boolean;
  onGrade: (cardId: string, grade: Grade) => void;
  onExit: () => void;
  onRestart: () => void;
}

const GRADES: { grade: Grade; key: string; label: string }[] = [
  { grade: 'again', key: '1', label: 'Again' },
  { grade: 'good', key: '2', label: 'Good' },
  { grade: 'easy', key: '3', label: 'Easy' },
];

export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

export function StudySession({ deck, queue, mode, autoPlay, onGrade, onExit, onRestart }: Props) {
  const cardsById = useMemo(() => new Map<string, Card>(deck.cards.map((c) => [c.id, c])), [deck]);
  const [session, setSession] = useState(() => startSession(queue));
  const [revealed, setRevealed] = useState(false);
  const card = session.queue.length > 0 ? cardsById.get(session.queue[0]) : undefined;
  // Distinguish repeat showings of the same card (after Again) for auto-play.
  const showing = session.answered;

  const grade = (g: Grade) => {
    if (!card || !revealed) return;
    if (mode === 'study') onGrade(card.id, g);
    setSession((s) => answer(s, g));
    setRevealed(false);
  };

  useEffect(() => {
    if (card && autoPlay) speaker.speak(card.hebrew);
  }, [card, showing, autoPlay]);

  useEffect(() => () => void speaker.stop(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (!card) return;
      if (e.key === ' ') {
        e.preventDefault(); // don't also "click" a focused button
        if (!revealed) setRevealed(true);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (speaker.canPlay(card.hebrew)) speaker.speak(card.hebrew);
      } else if (revealed) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) {
          e.preventDefault();
          grade(g.grade);
        }
      }
    };
    const swallowSpaceUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isTypingTarget(e.target)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', swallowSpaceUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', swallowSpaceUp);
    };
  });

  if (session.total === 0) {
    return (
      <div className="session-done">
        <p>Nothing to study right now: no cards are due and no new cards are left in this selection.</p>
        <button type="button" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="session-done" data-testid="session-done">
        <h2>Session complete</h2>
        <p>
          {session.completed} card{session.completed === 1 ? '' : 's'} reviewed, {session.missed} miss
          {session.missed === 1 ? '' : 'es'}.
          {mode === 'practice' && ' Practice mode: your schedule was not changed.'}
        </p>
        <div className="row">
          <button type="button" onClick={onRestart}>
            {mode === 'practice' ? 'Practice again' : 'Study again'}
          </button>
          <button type="button" className="secondary" onClick={onExit}>
            Back to deck
          </button>
        </div>
      </div>
    );
  }

  const done = session.completed;
  return (
    <div className="session">
      <div className="session-bar">
        <span className="mode-badge">{mode === 'practice' ? 'Practice (schedule unchanged)' : 'Study'}</span>
        <span className="count" data-testid="progress">
          {done} / {session.total}
        </span>
      </div>
      <div className="progress" aria-hidden="true">
        <div style={{ width: `${(100 * done) / session.total}%` }} />
      </div>

      <CardView key={`${card.id}#${showing}`} card={card} revealed={revealed} />

      <div className="actions">
        {!revealed ? (
          <button type="button" className="primary wide" onClick={() => setRevealed(true)}>
            Show answer <kbd>Space</kbd>
          </button>
        ) : (
          <div className="grades">
            {GRADES.map((g) => (
              <button key={g.grade} type="button" className={`grade grade-${g.grade}`} onClick={() => grade(g.grade)}>
                {g.label} <kbd>{g.key}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="keys-hint">
        <kbd>Space</kbd> reveal · <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> grade · <kbd>S</kbd> audio · <kbd>Esc</kbd> back
      </p>
    </div>
  );
}

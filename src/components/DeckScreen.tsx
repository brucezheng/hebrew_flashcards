import type { Deck } from '../engine/decks';
import { isDue, isNew, type Progress } from '../engine/srs';
import type { StudyMode } from './StudySession';

interface Props {
  deck: Deck;
  group: string | null;
  progress: Progress;
  newPerSession: number;
  now: number;
  onGroup: (group: string | null) => void;
  onStart: (mode: StudyMode) => void;
}

export function cardsInGroup(deck: Deck, group: string | null) {
  return group ? deck.cards.filter((c) => c.group === group) : deck.cards;
}

export function DeckScreen({ deck, group, progress, newPerSession, now, onGroup, onStart }: Props) {
  const cards = cardsInGroup(deck, group);
  const due = cards.filter((c) => isDue(c.id, progress, now)).length;
  const fresh = cards.filter((c) => isNew(c.id, progress)).length;
  const freshInSession = Math.min(fresh, newPerSession);
  const sessionSize = due + freshInSession;

  return (
    <div className="deck-screen">
      <h2>{deck.title}</h2>
      <p className="muted">{deck.subtitle}</p>

      {deck.groups.length > 0 && (
        <div className="chips" role="group" aria-label="Drill one word">
          <button type="button" className={`chip ${group === null ? 'on' : ''}`} onClick={() => onGroup(null)}>
            All
          </button>
          {deck.groups.map((g) => (
            <button
              key={g.key}
              type="button"
              className={`chip ${group === g.key ? 'on' : ''}`}
              aria-pressed={group === g.key}
              onClick={() => onGroup(g.key)}
            >
              <span lang="he" dir="rtl" className="he">
                {g.label}
              </span>
              {g.sublabel && <span className="chip-sub">{g.sublabel}</span>}
            </button>
          ))}
        </div>
      )}

      <dl className="stats">
        <div>
          <dt>Due</dt>
          <dd data-testid="due-count">{due}</dd>
        </div>
        <div>
          <dt>New</dt>
          <dd>{fresh}</dd>
        </div>
        <div>
          <dt>Cards</dt>
          <dd>{cards.length}</dd>
        </div>
      </dl>

      <div className="row">
        <button type="button" className="primary" disabled={sessionSize === 0} onClick={() => onStart('study')}>
          Study {sessionSize > 0 ? `(${due} due + ${freshInSession} new)` : '— nothing due'}
        </button>
        <button type="button" className="secondary" onClick={() => onStart('practice')}>
          Practice all ({cards.length})
        </button>
      </div>
      <p className="muted small">Practice all goes through every card in the selection without changing your schedule.</p>
    </div>
  );
}

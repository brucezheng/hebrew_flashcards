import { useEffect, useMemo, useState } from 'react';
import { speaker } from './audio/speaker';
import { useSpeaker } from './audio/useSpeaker';
import { cardsInGroup, DeckScreen } from './components/DeckScreen';
import { Reference } from './components/Reference';
import { isTypingTarget, StudySession, type StudyMode } from './components/StudySession';
import { content } from './data';
import { buildDecks } from './engine/decks';
import { isDue, isNew, planSession, schedule, shuffle, type Grade } from './engine/srs';
import { loadState, saveState, type Settings } from './engine/storage';

type View =
  | { name: 'home' }
  | { name: 'deck'; deckId: string }
  | { name: 'session'; deckId: string; mode: StudyMode; queue: string[]; run: number }
  | { name: 'reference' };

export function App() {
  const decks = useMemo(() => buildDecks(content), []);
  const [saved, setSaved] = useState(loadState);
  const [view, setView] = useState<View>({ name: 'home' });
  const [groups, setGroups] = useState<Record<string, string | null>>({});
  const speakerState = useSpeaker();
  const { progress, settings } = saved;
  const now = Date.now();

  useEffect(() => saveState(saved), [saved]);
  useEffect(() => {
    speaker.rate = settings.speechRate;
  }, [settings.speechRate]);

  // Esc = back, from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isTypingTarget(e.target)) return;
      if (view.name === 'session') setView({ name: 'deck', deckId: view.deckId });
      else if (view.name !== 'home') setView({ name: 'home' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  const updateSettings = (patch: Partial<Settings>) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const onGrade = (cardId: string, grade: Grade) =>
    setSaved((s) => ({ ...s, progress: { ...s.progress, [cardId]: schedule(s.progress[cardId], grade, Date.now()) } }));

  const startSession = (deckId: string, mode: StudyMode, run = 0) => {
    const deck = decks.find((d) => d.id === deckId)!;
    const ids = cardsInGroup(deck, groups[deckId] ?? null).map((c) => c.id);
    let queue: string[];
    if (mode === 'practice') queue = shuffle(ids);
    else {
      const plan = planSession(ids, saved.progress, settings.newPerSession, Date.now());
      queue = [...shuffle(plan.due), ...shuffle(plan.fresh)];
    }
    setView({ name: 'session', deckId, mode, queue, run });
  };

  const deck = 'deckId' in view ? decks.find((d) => d.id === view.deckId) : undefined;

  return (
    <div className="app">
      <header className="top">
        <button type="button" className="brand" onClick={() => setView({ name: 'home' })}>
          <span lang="he" dir="rtl" className="he">
            עִבְרִית
          </span>{' '}
          <span className="brand-text">Biblical Hebrew</span>
        </button>
        <nav>
          {view.name !== 'home' && (
            <button type="button" className="link" onClick={() => setView(view.name === 'session' ? { name: 'deck', deckId: view.deckId } : { name: 'home' })}>
              ← Back <kbd>Esc</kbd>
            </button>
          )}
          {view.name !== 'reference' && (
            <button type="button" className="link" onClick={() => setView({ name: 'reference' })}>
              Reference
            </button>
          )}
        </nav>
      </header>

      <main>
        {speakerState.stalled && (
          <p className="notice" role="status" data-testid="speech-stalled">
            Speech isn't responding. The browser accepted the request but your system never started speaking. If other
            apps are silent too, your computer's audio output is stuck; restarting the browser or computer usually fixes it.
          </p>
        )}
        {view.name === 'home' && (
          <>
            <ul className="deck-list">
              {decks.map((d) => {
                const due = d.cards.filter((c) => isDue(c.id, progress, now)).length;
                const fresh = d.cards.filter((c) => isNew(c.id, progress)).length;
                return (
                  <li key={d.id}>
                    <button type="button" className="deck-tile" onClick={() => setView({ name: 'deck', deckId: d.id })}>
                      <span className="deck-title">{d.title}</span>
                      <span className="muted small">{d.subtitle}</span>
                      <span className="deck-counts">
                        <span className={due ? 'due' : ''}>{due} due</span> · {fresh} new · {d.cards.length} cards
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <section className="settings">
              <h2>Settings</h2>
              <label>
                New cards per session
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={settings.newPerSession}
                  onChange={(e) => updateSettings({ newPerSession: Math.max(0, Number(e.target.value) || 0) })}
                />
              </label>
              <label>
                Speech rate
                <select value={settings.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}>
                  <option value={0.6}>Slow</option>
                  <option value={0.8}>Relaxed</option>
                  <option value={1}>Normal</option>
                </select>
              </label>
              <label className="check">
                <input type="checkbox" checked={settings.autoPlay} onChange={(e) => updateSettings({ autoPlay: e.target.checked })} />
                Play audio automatically when a card appears
              </label>
              <p className="muted small" data-testid="voice-status">
                {speakerState.voiceName
                  ? `Voice: ${speakerState.voiceName}`
                  : 'No Hebrew speech voice found. Audio buttons are disabled except for recorded files. On macOS, add the "Carmit" voice in System Settings → Accessibility → Spoken Content.'}
              </p>
            </section>
          </>
        )}

        {view.name === 'deck' && deck && (
          <DeckScreen
            deck={deck}
            group={groups[deck.id] ?? null}
            progress={progress}
            newPerSession={settings.newPerSession}
            now={now}
            onGroup={(g) => setGroups((s) => ({ ...s, [deck.id]: g }))}
            onStart={(mode) => startSession(deck.id, mode)}
          />
        )}

        {view.name === 'session' && deck && (
          <StudySession
            key={view.run}
            deck={deck}
            queue={view.queue}
            mode={view.mode}
            autoPlay={settings.autoPlay}
            onGrade={onGrade}
            onExit={() => setView({ name: 'deck', deckId: deck.id })}
            onRestart={() => startSession(deck.id, view.mode, view.run + 1)}
          />
        )}

        {view.name === 'reference' && <Reference />}
      </main>
    </div>
  );
}

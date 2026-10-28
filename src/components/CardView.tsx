import type { Card } from '../engine/decks';
import { He, PlayButton, SpokenWord } from './Hebrew';

export function CardView({ card, revealed }: { card: Card; revealed: boolean }) {
  return (
    <div className="card">
      <div className="card-front">
        <He className="card-hebrew">{card.hebrew}</He>
        <PlayButton text={card.hebrew} />
      </div>
      {revealed && <CardBack card={card} />}
    </div>
  );
}

function CardBack({ card }: { card: Card }) {
  return (
    <div className="card-back" data-testid="card-back">
      {card.gloss && <p className="gloss">{card.gloss}</p>}
      {card.translit && <p className="translit">{card.translit}</p>}

      {card.parsings.length > 0 && (
        <ul className="parsings">
          {card.parsings.map((p, i) => (
            <li key={i}>
              <span className="gloss">{p.gloss}</span>
              <span className="tags">
                {p.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
                {p.lexical && (
                  <span className="lexical">
                    from <He>{p.lexical}</He>
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {card.parsings.length > 1 && <p className="hint">Same spelling, {card.parsings.length} parsings.</p>}

      {card.details.length > 0 && (
        <dl className="details">
          {card.details.map((d) => (
            <div key={d.label}>
              <dt>{d.label}</dt>
              <dd>{d.hebrew ? <SpokenWord text={d.value} /> : d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {card.alts.length > 0 && (
        <p className="alts">
          Also:{' '}
          {card.alts.map((a) => (
            <SpokenWord key={a} text={a} />
          ))}
        </p>
      )}
      {card.note && <p className="note">{card.note}</p>}
    </div>
  );
}

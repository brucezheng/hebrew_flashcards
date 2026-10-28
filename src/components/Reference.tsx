import { Fragment, useState } from 'react';
import { content } from '../data';
import { lexicalFormOf } from '../engine/decks';
import { SUFFIX_PGNS, conjugate, englishVerb, objectSuffixForms, suffixedNounForms } from '../engine/forms';
import type { GeneratedForm } from '../engine/forms';
import type { PGN, SuffixPGN } from '../engine/types';
import { SpokenWord } from './Hebrew';

type Tab = 'nouns' | 'verbs' | 'possessive' | 'object';
const TABS: { id: Tab; label: string }[] = [
  { id: 'nouns', label: 'Nouns' },
  { id: 'verbs', label: 'Verbs' },
  { id: 'possessive', label: 'Possessive suffixes' },
  { id: 'object', label: 'Object suffixes' },
];

export function Reference() {
  const [tab, setTab] = useState<Tab>('nouns');
  return (
    <div className="reference">
      <h2>Reference</h2>
      <p className="muted small">Click any Hebrew word to hear it.</p>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'nouns' && <NounTable />}
      {tab === 'verbs' && content.verbs.map((v) => <VerbParadigm key={v.root} root={v.root} />)}
      {tab === 'possessive' && <PossessiveGrid />}
      {tab === 'object' && content.verbs.map((v) => <ObjectGrid key={v.root} root={v.root} />)}
    </div>
  );
}

function Cell({ form }: { form?: GeneratedForm }) {
  if (!form) return <span className="muted">—</span>;
  return (
    <>
      <SpokenWord text={form.form} />
      {form.alts.map((a) => (
        <span key={a} className="alt">
          also <SpokenWord text={a} />
        </span>
      ))}
    </>
  );
}

function NounTable() {
  const gender = { m: 'm', f: 'f', 'm/f': 'm/f' };
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Noun</th>
            <th>Gloss</th>
            <th>Gender</th>
            <th>Plural</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {content.nouns.map((n) => (
            <tr key={n.lemma}>
              <td>
                <SpokenWord text={n.lemma} />
                <div className="translit small">{n.translit}</div>
              </td>
              <td>{n.gloss}</td>
              <td>{gender[n.gender]}</td>
              <td>
                {n.plural ? <SpokenWord text={n.plural} /> : <span className="muted">—</span>}
                {n.pluralLabel && <div className="small muted">{n.pluralLabel}</div>}
              </td>
              <td className="small">{n.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ROWS: PGN[] = ['3ms', '3fs', '2ms', '2fs', '1cs', '3mp', '3fp', '2mp', '2fp', '1cp'];

function VerbParadigm({ root }: { root: string }) {
  const verb = content.verbs.find((v) => v.root === root)!;
  const columns = content.conjugations
    .map((conj) => ({ conj, forms: new Map(conjugate(verb, conj, content.verbClasses).map((f) => [f.pgn, f])) }))
    .filter((c) => c.forms.size > 0);
  return (
    <section className="paradigm">
      <h3>
        <SpokenWord text={lexicalFormOf(verb, content)} /> <span className="muted">{verb.meaning ?? verb.gloss.base}</span>
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PGN</th>
              {columns.map((c) => (
                <th key={c.conj.id}>
                  {c.conj.stem} {c.conj.tense.toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {columns.map(({ conj, forms }) => {
                  if (forms.has(row)) return <td key={conj.id}><Cell form={forms.get(row)} /></td>;
                  // 3cp (perfect) spans the 3mp and 3fp rows.
                  if (row === '3mp' && forms.has('3cp'))
                    return (
                      <td key={conj.id} rowSpan={2}>
                        <Cell form={forms.get('3cp')} /> <span className="tag">3cp</span>
                      </td>
                    );
                  if (row === '3fp' && forms.has('3cp')) return null;
                  return <td key={conj.id}><Cell /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PossessiveGrid() {
  const columns = content.suffixedNouns.flatMap((noun) =>
    (['singular', 'plural'] as const)
      .map((number) => ({
        key: `${noun.lemma}-${number}`,
        noun,
        number,
        forms: new Map(suffixedNounForms(noun, number, content.possessiveSuffixes[number]).map((f) => [f.pgn, f])),
      }))
      .filter((c) => c.forms.size > 0),
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Suffix</th>
            <th />
            {columns.map((c) => (
              <th key={c.key}>
                <SpokenWord text={c.noun.lemma} />
                <div className="small muted">
                  {c.number === 'singular' ? c.noun.gloss : `${c.noun.pluralGloss ?? c.noun.gloss} (pl.)`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SUFFIX_PGNS.map((pgn) => (
            <tr key={pgn}>
              <th scope="row">{pgn}</th>
              <td className="small muted">{content.possessor[pgn]}</td>
              {columns.map((c) => (
                <td key={c.key}>
                  <Cell form={c.forms.get(pgn)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ObjectGrid({ root }: { root: string }) {
  const verb = content.verbs.find((v) => v.root === root)!;
  const english = englishVerb(verb.gloss);
  const hosts = content.objectSuffixHosts
    .map((host) => {
      const conj = content.conjugations.find((c) => c.id === host.conjugation)!;
      return {
        host,
        conj,
        forms: new Map<SuffixPGN, GeneratedForm>(
          objectSuffixForms(verb, host.id, content.verbClasses).map((f) => [f.pgn, f]),
        ),
      };
    })
    .filter((h) => h.forms.size > 0);
  if (hosts.length === 0) return null;
  return (
    <section className="paradigm">
      <h3>
        <SpokenWord text={lexicalFormOf(verb, content)} /> <span className="muted">{english.base}</span>
      </h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Suffix</th>
              {hosts.map(({ host, conj }) => (
                <th key={host.id} colSpan={2}>
                  {conj.stem} {conj.tense.toLowerCase()} {host.pgn} + suffix
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUFFIX_PGNS.map((pgn) => (
              <tr key={pgn}>
                <th scope="row">{pgn}</th>
                {hosts.map(({ host, conj, forms }) => (
                  <Fragment key={host.id}>
                    <td>
                      <Cell form={forms.get(pgn)} />
                    </td>
                    <td className="small muted">
                      {conj.gloss(host.pgn, english)} {content.object[pgn]}
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

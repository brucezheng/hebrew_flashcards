// Build study decks (cards) from content.

import { nfc, rootKey } from './hebrew';
import {
  conjugate,
  englishVerb,
  objectSuffixForms,
  suffixedNounForms,
  verbForm,
} from './forms';
import type {
  ConjugationDef,
  NounEntry,
  ObjectSuffixHost,
  PGN,
  SuffixPGN,
  SuffixedNounEntry,
  VerbClassDef,
  VerbEntry,
} from './types';

export interface Parsing {
  /** English for this reading, e.g. 'she will kill'. */
  gloss: string;
  /** e.g. ['Qal', 'Imperfect', '3fs'] */
  tags: string[];
  /** Lexical form, e.g. 'קָטַל'. */
  lexical?: string;
}

export interface Card {
  id: string;
  deckId: string;
  /** Filter-chip key (the word this card drills), if the deck has chips. */
  group?: string;
  /** Front of the card, NFC. */
  hebrew: string;
  /** Alternative spellings, shown on the back. */
  alts: string[];
  /** Main English gloss (nouns). */
  gloss?: string;
  translit?: string;
  details: { label: string; value: string; hebrew?: boolean }[];
  /** Every parsing of this spelling (homographs are merged into one card). */
  parsings: Parsing[];
  note?: string;
}

export interface DeckGroup {
  key: string;
  /** Hebrew label for the chip. */
  label: string;
  sublabel?: string;
}

export interface Deck {
  id: string;
  title: string;
  subtitle: string;
  groups: DeckGroup[];
  cards: Card[];
}

export interface Content {
  nouns: NounEntry[];
  verbs: VerbEntry[];
  verbClasses: Record<string, VerbClassDef>;
  conjugations: ConjugationDef[];
  lexicalForm: { conjugation: string; pgn: PGN };
  subject: Record<PGN, string>;
  object: Record<SuffixPGN, string>;
  objectSuffixHosts: ObjectSuffixHost[];
  suffixedNouns: SuffixedNounEntry[];
  possessiveSuffixes: Record<'singular' | 'plural', Record<SuffixPGN, string>>;
  possessor: Record<SuffixPGN, string>;
}

/** Merge cards with the same spelling (and chip) into one card listing every parsing. */
export function mergeHomographs(cards: Card[]): Card[] {
  const byKey = new Map<string, Card>();
  for (const card of cards) {
    const key = `${card.group ?? ''}|${nfc(card.hebrew)}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...card, alts: [...card.alts], parsings: [...card.parsings] });
      continue;
    }
    existing.parsings.push(...card.parsings);
    for (const alt of card.alts) if (!existing.alts.includes(alt)) existing.alts.push(alt);
  }
  return [...byKey.values()];
}

export function lexicalFormOf(verb: VerbEntry, content: Content): string {
  const conj = content.conjugations.find((c) => c.id === content.lexicalForm.conjugation);
  const form = conj && verbForm(verb, conj, content.lexicalForm.pgn, content.verbClasses);
  if (!form) throw new Error(`No lexical form for root ${verb.root}`);
  return form;
}

function verbGroups(content: Content): DeckGroup[] {
  return content.verbs.map((v) => ({
    key: rootKey(v.root),
    label: lexicalFormOf(v, content),
    sublabel: v.gloss.base,
  }));
}

function nounDeck(content: Content): Deck {
  const genderLabel = { m: 'masculine', f: 'feminine', 'm/f': 'masculine / feminine' };
  return {
    id: 'nouns',
    title: 'Basic nouns',
    subtitle: `${content.nouns.length} high-frequency nouns`,
    groups: [],
    cards: content.nouns.map((n) => ({
      id: `noun:${nfc(n.lemma)}`,
      deckId: 'nouns',
      hebrew: nfc(n.lemma),
      alts: [],
      gloss: n.gloss,
      translit: n.translit,
      details: [
        { label: 'Gender', value: genderLabel[n.gender] },
        ...(n.plural ? [{ label: n.pluralLabel ?? 'Plural', value: nfc(n.plural), hebrew: true }] : []),
      ],
      parsings: [],
      note: n.note,
    })),
  };
}

function verbDecks(content: Content): Deck[] {
  const groups = verbGroups(content);
  const decks: Deck[] = [];
  for (const conj of content.conjugations) {
    const deckId = `verbs:${conj.id}`;
    const cards: Card[] = [];
    for (const verb of content.verbs) {
      const lexical = lexicalFormOf(verb, content);
      const english = englishVerb(verb.gloss);
      for (const f of conjugate(verb, conj, content.verbClasses)) {
        cards.push({
          id: `${conj.id}:${rootKey(verb.root)}:${f.pgn}`,
          deckId,
          group: rootKey(verb.root),
          hebrew: f.form,
          alts: f.alts,
          details: verb.meaning ? [{ label: 'Meaning', value: verb.meaning }] : [],
          parsings: [{ gloss: conj.gloss(f.pgn, english), tags: [conj.stem, conj.tense, f.pgn], lexical }],
        });
      }
    }
    if (cards.length === 0) continue;
    decks.push({
      id: deckId,
      title: `${conj.stem} ${conj.tense.toLowerCase()}`,
      subtitle: `${content.verbs.length} verbs · ${conj.persons.length} persons`,
      groups,
      cards: mergeHomographs(cards),
    });
  }
  return decks;
}

function possessiveDeck(content: Content): Deck {
  const cards: Card[] = [];
  for (const noun of content.suffixedNouns) {
    for (const number of ['singular', 'plural'] as const) {
      const english = number === 'singular' ? noun.gloss : noun.pluralGloss ?? noun.gloss;
      for (const f of suffixedNounForms(noun, number, content.possessiveSuffixes[number])) {
        cards.push({
          id: `poss:${nfc(noun.lemma)}:${number}:${f.pgn}`,
          deckId: 'possessive',
          group: nfc(noun.lemma),
          hebrew: f.form,
          alts: f.alts,
          details: [],
          parsings: [
            {
              gloss: `${content.possessor[f.pgn as SuffixPGN]} ${english}`,
              tags: [`${number} noun`, `+ ${f.pgn} suffix`],
              lexical: nfc(noun.lemma),
            },
          ],
          note: noun.note,
        });
      }
    }
  }
  return {
    id: 'possessive',
    title: 'Possessive suffixes',
    subtitle: 'Pronominal suffixes on nouns',
    groups: content.suffixedNouns.map((n) => ({ key: nfc(n.lemma), label: nfc(n.lemma), sublabel: n.gloss })),
    cards: mergeHomographs(cards),
  };
}

function objectDeck(content: Content): Deck {
  const cards: Card[] = [];
  for (const verb of content.verbs) {
    const lexical = lexicalFormOf(verb, content);
    const english = englishVerb(verb.gloss);
    for (const host of content.objectSuffixHosts) {
      const conj = content.conjugations.find((c) => c.id === host.conjugation);
      if (!conj) throw new Error(`Object-suffix host ${host.id}: unknown conjugation ${host.conjugation}`);
      for (const f of objectSuffixForms(verb, host.id, content.verbClasses)) {
        cards.push({
          id: `obj:${host.id}:${rootKey(verb.root)}:${f.pgn}`,
          deckId: 'object',
          group: rootKey(verb.root),
          hebrew: f.form,
          alts: f.alts,
          details: [],
          parsings: [
            {
              gloss: `${conj.gloss(host.pgn, english)} ${content.object[f.pgn as SuffixPGN]}`,
              tags: [conj.stem, conj.tense, host.pgn, `+ ${f.pgn} suffix`],
              lexical,
            },
          ],
        });
      }
    }
  }
  return {
    id: 'object',
    title: 'Object suffixes',
    subtitle: 'Pronominal suffixes on verbs',
    groups: verbGroups(content),
    cards: mergeHomographs(cards),
  };
}

export function buildDecks(content: Content): Deck[] {
  return [nounDeck(content), ...verbDecks(content), possessiveDeck(content), objectDeck(content)].filter(
    (d) => d.cards.length > 0,
  );
}

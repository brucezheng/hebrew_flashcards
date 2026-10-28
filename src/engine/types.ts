// Shapes of the content in src/data/. The engine turns these into cards.

/** Person-gender-number. Perfect uses 3cp; imperfect splits 3mp/3fp. */
export type PGN = '3ms' | '3fs' | '2ms' | '2fs' | '1cs' | '3cp' | '3mp' | '3fp' | '2mp' | '2fp' | '1cp';

/** PGN of a pronominal suffix (no 3cp). */
export type SuffixPGN = '1cs' | '2ms' | '2fs' | '3ms' | '3fs' | '1cp' | '2mp' | '2fp' | '3mp' | '3fp';

/** One form, or several: the first is the main form, the rest are shown as "also". */
export type FormValue = string | string[];

// ---------- Nouns ----------

export interface NounEntry {
  lemma: string;
  gloss: string;
  translit: string;
  gender: 'm' | 'f' | 'm/f';
  /** Plural (or dual) form, if there is one. */
  plural?: string;
  /** Label for `plural` when it is not an ordinary plural, e.g. 'dual'. */
  pluralLabel?: string;
  note?: string;
}

// ---------- Verbs ----------

export interface EnglishVerb {
  /** Plain form: 'kill', 'write'. */
  base: string;
  /** Simple past; defaults to base + 'ed'. */
  past?: string;
  /** Past participle, for passive stems; defaults to past. */
  participle?: string;
}

export interface VerbEntry {
  /** Consonantal root; ש must be pointed שׁ or שׂ. */
  root: string;
  /** Key into verbClasses. */
  class: string;
  gloss: EnglishVerb;
  /** Wider meaning, shown on the card back. */
  meaning?: string;
  /**
   * One-off irregular forms, keyed by conjugation ID (or object-suffix host ID)
   * then PGN. Values are fully pointed forms, not templates.
   */
  overrides?: Record<string, Partial<Record<PGN | SuffixPGN, FormValue>>>;
}

export type TemplateSet = Partial<Record<PGN | SuffixPGN, FormValue>>;

export interface VerbClassDef {
  label: string;
  /** Inherit every template not given here from another class. */
  extends?: string;
  /** conjugation ID → PGN → template */
  conjugations: Record<string, TemplateSet>;
  /** object-suffix host ID → suffix PGN → template */
  objectSuffixes?: Record<string, TemplateSet>;
}

export interface ConjugationDef {
  /** e.g. 'qal.perf' */
  id: string;
  stem: string;
  tense: string;
  /** PGNs in display order. */
  persons: PGN[];
  /** English for one form, e.g. ('3fs', kill) → 'she will kill'. */
  gloss: (pgn: PGN, verb: Required<EnglishVerb>) => string;
}

export interface ObjectSuffixHost {
  /** e.g. 'qal.perf.3ms' */
  id: string;
  conjugation: string;
  pgn: PGN;
}

// ---------- Suffixed nouns ----------

export interface SuffixedNounEntry {
  lemma: string;
  /** Singular English, e.g. 'horse'. */
  gloss: string;
  /** Plural English, e.g. 'horses'; needed when plural forms exist. */
  pluralGloss?: string;
  /** Unchanging stem for singular suffixes (stem + standard suffix set). */
  stem?: string;
  /** Unchanging stem for plural suffixes, e.g. 'סוּס' → סוּסַי; 'עָר' → עָרַי. */
  pluralStem?: string;
  /** Explicit forms for irregular nouns (or to override single stem forms). */
  forms?: {
    singular?: Partial<Record<SuffixPGN, FormValue>>;
    plural?: Partial<Record<SuffixPGN, FormValue>>;
  };
  note?: string;
}

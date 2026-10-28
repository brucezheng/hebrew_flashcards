// Generate verb paradigms and suffixed nouns from data.

import { applyFinalForms, nfc, parseRoot, stripFinalForms } from './hebrew';
import { applyTemplate } from './template';
import type {
  ConjugationDef,
  EnglishVerb,
  FormValue,
  PGN,
  SuffixPGN,
  SuffixedNounEntry,
  TemplateSet,
  VerbClassDef,
  VerbEntry,
} from './types';

export const SUFFIX_PGNS: SuffixPGN[] = ['1cs', '2ms', '2fs', '3ms', '3fs', '1cp', '2mp', '2fp', '3mp', '3fp'];

export interface GeneratedForm<P extends string = PGN | SuffixPGN> {
  pgn: P;
  /** Main form, NFC. */
  form: string;
  /** Alternative forms, NFC. */
  alts: string[];
}

function asList(v: FormValue): string[] {
  return Array.isArray(v) ? v : [v];
}

/** A literal pointed form from data: fix final letters and normalize. */
function literal(s: string): string {
  return nfc(applyFinalForms(s.trim()));
}

/** Templates for one conjugation (or object-suffix host), following `extends`. */
export function resolveTemplates(
  classes: Record<string, VerbClassDef>,
  className: string,
  kind: 'conjugations' | 'objectSuffixes',
  setId: string,
): TemplateSet {
  const chain: VerbClassDef[] = [];
  const seen = new Set<string>();
  let name: string | undefined = className;
  while (name) {
    if (seen.has(name)) throw new Error(`Verb class cycle at "${name}"`);
    seen.add(name);
    const def: VerbClassDef | undefined = classes[name];
    if (!def) throw new Error(`Unknown verb class "${name}"`);
    chain.unshift(def);
    name = def.extends;
  }
  return Object.assign({}, ...chain.map((def) => def[kind]?.[setId] ?? {}));
}

function generate<P extends PGN | SuffixPGN>(
  verb: VerbEntry,
  classes: Record<string, VerbClassDef>,
  kind: 'conjugations' | 'objectSuffixes',
  setId: string,
  order: P[],
): GeneratedForm<P>[] {
  const radicals = parseRoot(verb.root);
  const templates = resolveTemplates(classes, verb.class, kind, setId);
  const overrides = verb.overrides?.[setId] ?? {};
  const out: GeneratedForm<P>[] = [];
  for (const pgn of order) {
    const override = overrides[pgn];
    const template = templates[pgn];
    let forms: string[];
    if (override !== undefined) forms = asList(override).map(literal);
    else if (template !== undefined) forms = asList(template).map((t) => applyTemplate(t, radicals));
    else continue;
    out.push({ pgn, form: forms[0], alts: forms.slice(1) });
  }
  return out;
}

export function conjugate(
  verb: VerbEntry,
  conj: ConjugationDef,
  classes: Record<string, VerbClassDef>,
): GeneratedForm<PGN>[] {
  return generate(verb, classes, 'conjugations', conj.id, conj.persons);
}

export function objectSuffixForms(
  verb: VerbEntry,
  hostId: string,
  classes: Record<string, VerbClassDef>,
): GeneratedForm<SuffixPGN>[] {
  return generate(verb, classes, 'objectSuffixes', hostId, SUFFIX_PGNS);
}

/** One form of a verb, e.g. its lexical form (Qal perfect 3ms). */
export function verbForm(
  verb: VerbEntry,
  conj: ConjugationDef,
  pgn: PGN,
  classes: Record<string, VerbClassDef>,
): string | undefined {
  return conjugate(verb, conj, classes).find((f) => f.pgn === pgn)?.form;
}

export function englishVerb(g: EnglishVerb): Required<EnglishVerb> {
  const past = g.past ?? `${g.base}ed`;
  return { base: g.base, past, participle: g.participle ?? past };
}

/** Join a stem and a suffix such as '-ְךָ'. */
export function attachSuffix(stem: string, suffix: string): string {
  return nfc(applyFinalForms(stripFinalForms(nfc(stem).trim()) + suffix.replace(/^-/, '')));
}

/** Suffixed forms of a noun, from its stem + the suffix set, with explicit forms taking precedence. */
export function suffixedNounForms(
  noun: SuffixedNounEntry,
  number: 'singular' | 'plural',
  suffixSet: Record<SuffixPGN, string>,
): GeneratedForm<SuffixPGN>[] {
  const stem = number === 'singular' ? noun.stem : noun.pluralStem;
  const explicit = noun.forms?.[number] ?? {};
  const out: GeneratedForm<SuffixPGN>[] = [];
  for (const pgn of SUFFIX_PGNS) {
    let forms: string[];
    if (explicit[pgn] !== undefined) forms = asList(explicit[pgn]).map(literal);
    else if (stem) forms = [attachSuffix(stem, suffixSet[pgn])];
    else continue;
    out.push({ pgn, form: forms[0], alts: forms.slice(1) });
  }
  return out;
}

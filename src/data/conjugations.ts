import type { ConjugationDef, ObjectSuffixHost, PGN, SuffixPGN } from '../engine/types';

// English subject pronouns, used by the gloss rules.
export const SUBJECT: Record<PGN, string> = {
  '3ms': 'he',
  '3fs': 'she',
  '2ms': 'you (m.s.)',
  '2fs': 'you (f.s.)',
  '1cs': 'I',
  '3cp': 'they',
  '3mp': 'they (m.)',
  '3fp': 'they (f.)',
  '2mp': 'you (m.pl.)',
  '2fp': 'you (f.pl.)',
  '1cp': 'we',
};

export const OBJECT: Record<SuffixPGN, string> = {
  '1cs': 'me',
  '2ms': 'you (m.s.)',
  '2fs': 'you (f.s.)',
  '3ms': 'him',
  '3fs': 'her',
  '1cp': 'us',
  '2mp': 'you (m.pl.)',
  '2fp': 'you (f.pl.)',
  '3mp': 'them (m.)',
  '3fp': 'them (f.)',
};

const PERFECT_PERSONS: PGN[] = ['3ms', '3fs', '2ms', '2fs', '1cs', '3cp', '2mp', '2fp', '1cp'];
const IMPERFECT_PERSONS: PGN[] = ['3ms', '3fs', '2ms', '2fs', '1cs', '3mp', '3fp', '2mp', '2fp', '1cp'];

// Each conjugation gets its own study deck and Reference column, as soon as
// at least one verb class has templates for it (see src/data/verbClasses.ts).
export const conjugations: ConjugationDef[] = [
  {
    id: 'qal.perf',
    stem: 'Qal',
    tense: 'Perfect',
    persons: PERFECT_PERSONS,
    gloss: (pgn, v) => `${SUBJECT[pgn]} ${v.past}`,
  },
  {
    id: 'qal.impf',
    stem: 'Qal',
    tense: 'Imperfect',
    persons: IMPERFECT_PERSONS,
    gloss: (pgn, v) => `${SUBJECT[pgn]} will ${v.base}`,
  },
];

/** The form a verb is listed under in a lexicon. */
export const LEXICAL_FORM = { conjugation: 'qal.perf', pgn: '3ms' as PGN };

// Verb forms that take object suffixes in the Object suffixes deck.
export const objectSuffixHosts: ObjectSuffixHost[] = [
  { id: 'qal.perf.3ms', conjugation: 'qal.perf', pgn: '3ms' },
  { id: 'qal.impf.3ms', conjugation: 'qal.impf', pgn: '3ms' },
];

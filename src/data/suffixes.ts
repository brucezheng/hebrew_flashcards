import type { SuffixPGN, SuffixedNounEntry } from '../engine/types';

// Possessive suffixes. The leading '-' marks the join with the stem (so the
// first vowel has something to sit on in the editor); the engine strips it.
export const POSSESSIVE_SUFFIXES: Record<'singular' | 'plural', Record<SuffixPGN, string>> = {
  singular: {
    '1cs': '-ִי',
    '2ms': '-ְךָ',
    '2fs': '-ֵךְ',
    '3ms': '-וֹ',
    '3fs': '-ָהּ',
    '1cp': '-ֵנוּ',
    '2mp': '-ְכֶם',
    '2fp': '-ְכֶן',
    '3mp': '-ָם',
    '3fp': '-ָן',
  },
  plural: {
    '1cs': '-ַי',
    '2ms': '-ֶיךָ',
    '2fs': '-ַיִךְ',
    '3ms': '-ָיו',
    '3fs': '-ֶיהָ',
    '1cp': '-ֵינוּ',
    '2mp': '-ֵיכֶם',
    '2fp': '-ֵיכֶן',
    '3mp': '-ֵיהֶם',
    '3fp': '-ֵיהֶן',
  },
};

export const POSSESSOR: Record<SuffixPGN, string> = {
  '1cs': 'my',
  '2ms': 'your (m.s.)',
  '2fs': 'your (f.s.)',
  '3ms': 'his',
  '3fs': 'her',
  '1cp': 'our',
  '2mp': 'your (m.pl.)',
  '2fp': 'your (f.pl.)',
  '3mp': 'their (m.)',
  '3fp': 'their (f.)',
};

// Nouns drilled with possessive suffixes.
export const suffixedNouns: SuffixedNounEntry[] = [
  { lemma: 'סוּס', gloss: 'horse', pluralGloss: 'horses', stem: 'סוּס', pluralStem: 'סוּס' },
  { lemma: 'קוֹל', gloss: 'voice', stem: 'קוֹל' },
  { lemma: 'עִיר', gloss: 'city', pluralGloss: 'cities', stem: 'עִיר', pluralStem: 'עָר', note: 'Plural עָרִים: the plural stem is עָר-.' },
  { lemma: 'אִישׁ', gloss: 'man / husband', stem: 'אִישׁ' },
  {
    lemma: 'אָב',
    gloss: 'father',
    note: 'Irregular: before suffixes the stem is אֲבִי- (cf. construct אֲבִי).',
    forms: {
      singular: {
        '1cs': 'אָבִי',
        '2ms': 'אָבִיךָ',
        '2fs': 'אָבִיךְ',
        '3ms': ['אָבִיו', 'אָבִיהוּ'],
        '3fs': 'אָבִיהָ',
        '1cp': 'אָבִינוּ',
        '2mp': 'אֲבִיכֶם',
        '2fp': 'אֲבִיכֶן',
        '3mp': 'אֲבִיהֶם',
        '3fp': 'אֲבִיהֶן',
      },
    },
  },
];

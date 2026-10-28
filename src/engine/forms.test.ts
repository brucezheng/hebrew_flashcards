import { describe, expect, it } from 'vitest';
import { content } from '../data';
import { applyFinalForms, nfc, parseRoot } from './hebrew';
import { applyTemplate } from './template';
import { attachSuffix, conjugate, objectSuffixForms, suffixedNounForms } from './forms';
import { buildDecks } from './decks';
import type { ConjugationDef, VerbEntry } from './types';

const conj = (id: string): ConjugationDef => content.conjugations.find((c) => c.id === id)!;
const verb = (root: string): VerbEntry => content.verbs.find((v) => v.root === root)!;

/** Generated paradigm as { pgn: NFC form }. */
function paradigm(root: string, conjId: string): Record<string, string> {
  return Object.fromEntries(conjugate(verb(root), conj(conjId), content.verbClasses).map((f) => [f.pgn, f.form]));
}

/** Normalize both sides: mark order in typed text varies. */
function expectForms(actual: Record<string, string>, expected: Record<string, string>) {
  const norm = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, nfc(v)]));
  expect(norm(actual)).toEqual(norm(expected));
}

describe('Qal perfect — קָטַל (full paradigm)', () => {
  it('matches the textbook paradigm', () => {
    expectForms(paradigm('קטל', 'qal.perf'), {
      '3ms': 'קָטַל',
      '3fs': 'קָטְלָה',
      '2ms': 'קָטַלְתָּ',
      '2fs': 'קָטַלְתְּ',
      '1cs': 'קָטַלְתִּי',
      '3cp': 'קָטְלוּ',
      '2mp': 'קְטַלְתֶּם',
      '2fp': 'קְטַלְתֶּן',
      '1cp': 'קָטַלְנוּ',
    });
  });
});

describe('Qal imperfect — קָטַל (full paradigm)', () => {
  it('matches the textbook paradigm', () => {
    expectForms(paradigm('קטל', 'qal.impf'), {
      '3ms': 'יִקְטֹל',
      '3fs': 'תִּקְטֹל',
      '2ms': 'תִּקְטֹל',
      '2fs': 'תִּקְטְלִי',
      '1cs': 'אֶקְטֹל',
      '3mp': 'יִקְטְלוּ',
      '3fp': 'תִּקְטֹלְנָה',
      '2mp': 'תִּקְטְלוּ',
      '2fp': 'תִּקְטֹלְנָה',
      '1cp': 'נִקְטֹל',
    });
  });
});

describe('begadkefat dagesh lene', () => {
  it('כָּתַב perfect: initial כּ, no dagesh after a vowel', () => {
    const p = paradigm('כתב', 'qal.perf');
    expect(p['3ms']).toBe(nfc('כָּתַב'));
    expect(p['3fs']).toBe(nfc('כָּתְבָה'));
    expect(p['2ms']).toBe(nfc('כָּתַבְתָּ'));
    expect(p['2mp']).toBe(nfc('כְּתַבְתֶּם'));
    expect(p['2fp']).toBe(nfc('כְּתַבְתֶּן'));
  });

  it('כָּתַב imperfect: תּ after silent shewa', () => {
    const p = paradigm('כתב', 'qal.impf');
    expect(p['3ms']).toBe(nfc('יִכְתֹּב'));
    expect(p['2fs']).toBe(nfc('תִּכְתְּבִי'));
    expect(p['3mp']).toBe(nfc('יִכְתְּבוּ'));
    expect(p['3fp']).toBe(nfc('תִּכְתֹּבְנָה'));
  });

  it('זָכַר imperfect: כּ after silent shewa', () => {
    const p = paradigm('זכר', 'qal.impf');
    expect(p['3ms']).toBe(nfc('יִזְכֹּר'));
    expect(p['2fs']).toBe(nfc('תִּזְכְּרִי'));
    expect(paradigm('זכר', 'qal.perf')['3ms']).toBe(nfc('זָכַר'));
  });
});

describe('shin dot preservation', () => {
  it('שָׁמַר / יִשְׁמֹר', () => {
    expect(paradigm('שׁמר', 'qal.perf')['3ms']).toBe(nfc('שָׁמַר'));
    expect(paradigm('שׁמר', 'qal.perf')['2mp']).toBe(nfc('שְׁמַרְתֶּם'));
    expect(paradigm('שׁמר', 'qal.impf')['3ms']).toBe(nfc('יִשְׁמֹר'));
    expect(paradigm('שׁמר', 'qal.impf')['2fs']).toBe(nfc('תִּשְׁמְרִי'));
  });

  it('rejects an undotted ש in a root', () => {
    expect(() => parseRoot('שמר')).toThrow(/שׁ/);
  });

  it('keeps a sin dot', () => {
    expect(applyTemplate('1*ָ2ַ3', parseRoot('שׂרף'))).toBe(nfc('שָׂרַף'));
  });
});

describe('final letter forms', () => {
  it('applies final forms at word end only', () => {
    expect(applyFinalForms('מלכ')).toBe('מלך');
    expect(applyFinalForms('ךלמ')).toBe('כלם');
    expect(applyFinalForms('סוּסֵכְ')).toBe('סוּסֵךְ');
  });

  it('templates produce final forms for final radicals', () => {
    // final ך gets its silent shewa automatically
    expect(applyTemplate('1*ָ2ַ3', parseRoot('מלכ'))).toBe(nfc('מָלַךְ'));
    expect(applyTemplate('יִ1ְ2*ֹ3', parseRoot('שׁפט'))).toBe(nfc('יִשְׁפֹּט'));
    expect(applyTemplate('1*ָ2ַ3', parseRoot('קבצ'))).toBe(nfc('קָבַץ'));
  });

  it('dagesh forte marker', () => {
    // Piel perfect 3ms shape
    expect(applyTemplate('1*ִ2!ֵ3', parseRoot('דבר'))).toBe(nfc('דִּבֵּר'));
  });
});

describe('possessive suffixes — סוּס (full paradigm)', () => {
  const sus = content.suffixedNouns.find((n) => n.lemma === 'סוּס')!;
  const forms = (number: 'singular' | 'plural') =>
    Object.fromEntries(
      suffixedNounForms(sus, number, content.possessiveSuffixes[number]).map((f) => [f.pgn, f.form]),
    );

  it('singular noun', () => {
    expectForms(forms('singular'), {
      '1cs': 'סוּסִי',
      '2ms': 'סוּסְךָ',
      '2fs': 'סוּסֵךְ',
      '3ms': 'סוּסוֹ',
      '3fs': 'סוּסָהּ',
      '1cp': 'סוּסֵנוּ',
      '2mp': 'סוּסְכֶם',
      '2fp': 'סוּסְכֶן',
      '3mp': 'סוּסָם',
      '3fp': 'סוּסָן',
    });
  });

  it('plural noun', () => {
    expectForms(forms('plural'), {
      '1cs': 'סוּסַי',
      '2ms': 'סוּסֶיךָ',
      '2fs': 'סוּסַיִךְ',
      '3ms': 'סוּסָיו',
      '3fs': 'סוּסֶיהָ',
      '1cp': 'סוּסֵינוּ',
      '2mp': 'סוּסֵיכֶם',
      '2fp': 'סוּסֵיכֶן',
      '3mp': 'סוּסֵיהֶם',
      '3fp': 'סוּסֵיהֶן',
    });
  });

  it('irregular אָב uses explicit forms', () => {
    const av = content.suffixedNouns.find((n) => n.lemma === 'אָב')!;
    const f = suffixedNounForms(av, 'singular', content.possessiveSuffixes.singular);
    expect(f.find((x) => x.pgn === '3ms')).toEqual({ pgn: '3ms', form: nfc('אָבִיו'), alts: [nfc('אָבִיהוּ')] });
    expect(suffixedNounForms(av, 'plural', content.possessiveSuffixes.plural)).toEqual([]);
  });

  it('a stem ending in a final letter goes medial before a suffix', () => {
    expect(attachSuffix('שֵׁם', '-וֹ')).toBe(nfc('שֵׁמוֹ'));
  });
});

describe('object suffixes', () => {
  const forms = (root: string, host: string) =>
    Object.fromEntries(objectSuffixForms(verb(root), host, content.verbClasses).map((f) => [f.pgn, f.form]));

  it('Qal perfect 3ms + suffixes (קָטַל)', () => {
    expectForms(forms('קטל', 'qal.perf.3ms'), {
      '1cs': 'קְטָלַנִי',
      '2ms': 'קְטָלְךָ',
      '2fs': 'קְטָלֵךְ',
      '3ms': 'קְטָלוֹ',
      '3fs': 'קְטָלָהּ',
      '1cp': 'קְטָלָנוּ',
      '2mp': 'קְטַלְכֶם',
      '2fp': 'קְטַלְכֶן',
      '3mp': 'קְטָלָם',
      '3fp': 'קְטָלָן',
    });
  });

  it('Qal imperfect 3ms + suffixes (קָטַל)', () => {
    expectForms(forms('קטל', 'qal.impf.3ms'), {
      '1cs': 'יִקְטְלֵנִי',
      '2ms': 'יִקְטָלְךָ',
      '2fs': 'יִקְטְלֵךְ',
      '3ms': 'יִקְטְלֵהוּ',
      '3fs': 'יִקְטְלֶהָ',
      '1cp': 'יִקְטְלֵנוּ',
      '2mp': 'יִקְטָלְכֶם',
      '2fp': 'יִקְטָלְכֶן',
      '3mp': 'יִקְטְלֵם',
      '3fp': 'יִקְטְלֵן',
    });
  });

  it('begadkefat with object suffixes (כָּתַב)', () => {
    expect(forms('כתב', 'qal.perf.3ms')['1cs']).toBe(nfc('כְּתָבַנִי'));
    expect(forms('כתב', 'qal.impf.3ms')['1cs']).toBe(nfc('יִכְתְּבֵנִי'));
  });
});

describe('verb classes and overrides', () => {
  it('a class can extend another and a verb can override one form', () => {
    const classes = {
      ...content.verbClasses,
      test: { label: 'Test', extends: 'strong', conjugations: { 'qal.perf': { '3ms': '1*ָ2ֵ3' } } },
    };
    const v: VerbEntry = {
      root: 'כבד',
      class: 'test',
      gloss: { base: 'be heavy' },
      overrides: { 'qal.perf': { '1cs': 'כָּבַדְתִּי' } },
    };
    const p = Object.fromEntries(conjugate(v, conj('qal.perf'), classes).map((f) => [f.pgn, f.form]));
    expect(p['3ms']).toBe(nfc('כָּבֵד'));
    expect(p['3fs']).toBe(nfc('כָּבְדָה'));
    expect(p['1cs']).toBe(nfc('כָּבַדְתִּי'));
  });
});

describe('decks', () => {
  const decks = buildDecks(content);

  it('builds one deck per conjugation plus nouns and both suffix decks', () => {
    expect(decks.map((d) => d.id)).toEqual(['nouns', 'verbs:qal.perf', 'verbs:qal.impf', 'possessive', 'object']);
    expect(decks[0].cards).toHaveLength(20);
  });

  it('merges homographs into one card listing every parsing', () => {
    const impf = decks.find((d) => d.id === 'verbs:qal.impf')!;
    const tiqtol = impf.cards.find((c) => c.hebrew === nfc('תִּקְטֹל'))!;
    expect(tiqtol.parsings.map((p) => p.tags[2])).toEqual(['3fs', '2ms']);
    expect(tiqtol.parsings.map((p) => p.gloss)).toEqual(['she will kill', 'you (m.s.) will kill']);
    const tiqtolna = impf.cards.find((c) => c.hebrew === nfc('תִּקְטֹלְנָה'))!;
    expect(tiqtolna.parsings.map((p) => p.tags[2])).toEqual(['3fp', '2fp']);
    // 10 PGNs → 8 cards per verb
    expect(impf.cards.filter((c) => c.group === 'קטל')).toHaveLength(8);
  });

  it('card IDs are unique', () => {
    const ids = decks.flatMap((d) => d.cards.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every noun lemma and plural is NFC with no stray ASCII', () => {
    for (const d of decks)
      for (const c of d.cards) {
        expect(c.hebrew).toBe(nfc(c.hebrew));
        expect(c.hebrew).not.toMatch(/[A-Za-z0-9*!-]/);
      }
  });
});

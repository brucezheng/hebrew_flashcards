// Paradigm templates: pointed Hebrew with slots for the radicals.
//
//   1 2 3 (4)  the 1st/2nd/3rd(/4th) radical
//   *          after a slot: dagesh lene if that radical is begadkefat (בגדכפת)
//   !          after a slot: dagesh forte (always), e.g. for Piel
//
// Vowels that follow a slot attach to that radical. Example (Qal impf 3ms):
//   'יִ1ְ2*ֹ3'  + כתב  →  יִכְתֹּב
// Final letter forms are applied afterwards, and the result is NFC-normalized.

import { DAGESH, SHEWA, applyFinalForms, isBegadkefat, nfc, type Radical } from './hebrew';

export function applyTemplate(template: string, radicals: Radical[]): string {
  let out = '';
  const chars = Array.from(template);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch >= '1' && ch <= '4') {
      const r = radicals[Number(ch) - 1];
      if (!r) throw new Error(`Template "${template}" uses radical ${ch}, but the root has ${radicals.length}`);
      out += r.letter + (r.dot ?? '');
      const marker = chars[i + 1];
      if (marker === '*') {
        if (isBegadkefat(r.letter)) out += DAGESH;
        i++;
      } else if (marker === '!') {
        out += DAGESH;
        i++;
      }
    } else if (ch === '*' || ch === '!') {
      throw new Error(`Template "${template}": "${ch}" must follow a radical slot`);
    } else {
      out += ch;
    }
  }
  return nfc(addFinalKafShewa(applyFinalForms(out)));
}

/** Word-final ך with no vowel is written with a silent shewa: מָלַךְ. */
function addFinalKafShewa(s: string): string {
  return s.replace(/ך(?![\u0591-\u05C7])/g, `ך${SHEWA}`);
}

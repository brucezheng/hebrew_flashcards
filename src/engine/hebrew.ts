// Low-level Hebrew Unicode helpers: letters, points, final forms, roots.

export const DAGESH = '\u05BC';
export const SHEWA = '\u05B0';
export const SHIN_DOT = '\u05C1';
export const SIN_DOT = '\u05C2';

const BEGADKEFAT = new Set(['ב', 'ג', 'ד', 'כ', 'פ', 'ת']);

const MEDIAL_TO_FINAL: Record<string, string> = { כ: 'ך', מ: 'ם', נ: 'ן', פ: 'ף', צ: 'ץ' };
const FINAL_TO_MEDIAL: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' };

/** Hebrew consonant (U+05D0–U+05EA), including final forms. */
export function isLetter(ch: string): boolean {
  return ch >= 'א' && ch <= 'ת';
}

/** Combining Hebrew mark: niqqud, dagesh, shin/sin dot, cantillation. Excludes maqaf (U+05BE). */
export function isMark(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (
    (c >= 0x0591 && c <= 0x05bd) ||
    c === 0x05bf ||
    c === 0x05c1 ||
    c === 0x05c2 ||
    c === 0x05c4 ||
    c === 0x05c5 ||
    c === 0x05c7
  );
}

export function isBegadkefat(letter: string): boolean {
  return BEGADKEFAT.has(toMedial(letter));
}

export function toMedial(letter: string): string {
  return FINAL_TO_MEDIAL[letter] ?? letter;
}

/** NFC-normalize. Use whenever comparing or keying pointed Hebrew. */
export function nfc(s: string): string {
  return s.normalize('NFC');
}

/**
 * Apply final letter forms: כמנפץ become ךםןףץ at the end of a word, and any
 * final form that is not at the end of a word becomes medial again.
 */
export function applyFinalForms(s: string): string {
  const chars = Array.from(s);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isLetter(ch)) continue;
    let j = i + 1;
    while (j < chars.length && isMark(chars[j])) j++;
    const atWordEnd = j >= chars.length || !isLetter(chars[j]);
    const medial = toMedial(ch);
    chars[i] = atWordEnd ? (MEDIAL_TO_FINAL[medial] ?? medial) : medial;
  }
  return chars.join('');
}

/** Replace any final forms with medial forms (before appending more letters). */
export function stripFinalForms(s: string): string {
  return Array.from(s).map(toMedial).join('');
}

/** Remove all points, leaving bare consonants. */
export function stripPoints(s: string): string {
  return Array.from(s.normalize('NFD')).filter((ch) => !isMark(ch)).join('');
}

export interface Radical {
  /** Bare consonant in medial form, e.g. 'כ'. */
  letter: string;
  /** Shin or sin dot, for ש only. */
  dot?: string;
}

/**
 * Parse a root such as 'קטל', 'שׁמר' or 'כתב' into radicals.
 * ש must carry a shin dot (שׁ) or sin dot (שׂ); no other points are allowed.
 */
export function parseRoot(root: string): Radical[] {
  const radicals: Radical[] = [];
  for (const ch of Array.from(root.normalize('NFD'))) {
    if (isLetter(ch)) {
      radicals.push({ letter: toMedial(ch) });
    } else if ((ch === SHIN_DOT || ch === SIN_DOT) && radicals.at(-1)?.letter === 'ש') {
      radicals[radicals.length - 1].dot = ch;
    } else if (ch.trim() !== '') {
      throw new Error(`Unexpected character U+${ch.codePointAt(0)!.toString(16)} in root "${root}"`);
    }
  }
  for (const r of radicals) {
    if (r.letter === 'ש' && !r.dot) {
      throw new Error(`Root "${root}": write ש as שׁ (shin) or שׂ (sin)`);
    }
  }
  if (radicals.length < 2) throw new Error(`Root "${root}" has too few radicals`);
  return radicals;
}

/** Unpointed root key, e.g. 'שמר' for 'שׁמר'. Stable ID fragment. */
export function rootKey(root: string): string {
  return parseRoot(root)
    .map((r) => r.letter)
    .join('');
}

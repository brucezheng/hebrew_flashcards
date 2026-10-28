# Biblical Hebrew Flashcards

A personal flashcard app for Biblical Hebrew: nouns, Qal perfect and imperfect, and pronominal suffixes (possessive on nouns, object on verbs). Hebrew → English, Leitner-box spaced repetition, audio, and reference paradigm tables. There is no backend; progress is saved in `localStorage`.

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # paradigm + SRS unit tests (Vitest)
npm run build        # type-check and build to dist/
```

## Studying

- **Decks:** Basic nouns, one deck per conjugation (Qal perfect, Qal imperfect), Possessive suffixes, Object suffixes. Verb and suffix decks have filter chips to drill a single word.
- **Study** = cards due now plus up to *N* new cards (N is set on the home screen). Grades: **Again** (back to box 0; the card returns 3 cards later in the same session), **Good** (+1 box), **Easy** (+2 boxes). Boxes 1–5 are due after 1, 3, 7, 14 and 30 days.
- **Practice all** goes through every card in the selection and never changes the schedule.
- Forms with the same spelling (תִּקְטֹל = 3fs and 2ms) are one card listing every parsing.
- **Keys:** `Space` reveal · `1`/`2`/`3` grade · `S` play audio · `Esc` back.

## Project layout

```
src/data/            ← content: edit these to add words
  nouns.ts             noun cards
  verbs.ts             verbs (root + class + English)
  verbClasses.ts       paradigm templates per verb class
  conjugations.ts      conjugation IDs, English gloss rules, object-suffix hosts
  suffixes.ts          possessive suffix sets + nouns drilled with suffixes
src/engine/          ← engine: no content in here
  hebrew.ts            Unicode helpers (final forms, roots, NFC)
  template.ts          template → pointed form
  forms.ts             paradigm / suffix generation
  decks.ts             content → decks and cards (homograph merging)
  srs.ts               Leitner scheduling and session queue
  storage.ts           localStorage
src/audio/speaker.ts   audio files + speech synthesis
public/audio/          recorded audio + manifest.json
scripts/browser-check.mjs  end-to-end check in real Chrome
```

## Adding content

All Hebrew is compared and stored NFC-normalized, so the order you type vowel points and dagesh in doesn't matter.

### A noun (one entry)

In `src/data/nouns.ts`:

```ts
{ lemma: 'לֵב', gloss: 'heart', translit: 'lēḇ', gender: 'm', plural: 'לִבּוֹת', note: 'Also לֵבָב.' },
```

`plural` and `note` are optional. Use `pluralLabel: 'dual'` for duals.

### A strong verb (one line)

In `src/data/verbs.ts`:

```ts
{ root: 'משׁל', class: 'strong', gloss: { base: 'rule', past: 'ruled' }, meaning: 'rule, govern' },
```

- Write `ש` with its dot: `שׁ` (shin) or `שׂ` (sin). The engine rejects a bare `ש`.
- Final letter forms in the root are fine (`'מלך'` = `'מלכ'`).
- `past` defaults to `base + "ed"`. Add `participle` for irregular past participles (used by passive stems later).

Every conjugation, object-suffix form, deck card, filter chip and Reference table for the verb is generated from this line.

### How templates work

A template is a pointed Hebrew word with **slots** for the radicals:

| Mark | Meaning |
|---|---|
| `1` `2` `3` (`4`) | 1st / 2nd / 3rd (/ 4th) radical. Vowels typed after the slot sit on that radical. |
| `*` after a slot | dagesh lene **if** that radical is begadkefat (בגדכפת). Put it wherever a begadkefat letter would take dagesh: word-initial, or after a silent shewa. |
| `!` after a slot | dagesh forte, always (e.g. Piel's doubled middle radical: `'1*ִ2!ֵ3'` → דִּבֵּר). |

Afterwards the engine applies final forms (ך ם ן ף ץ) and adds the silent shewa to a vowel-less final ך. Example, Qal imperfect 3ms: `'יִ1ְ2*ֹ3'` gives יִקְטֹל, יִכְתֹּב, יִזְכֹּר, יִשְׁמֹר.

Templates mix right-to-left Hebrew with left-to-right digits, so editors can display them oddly. The characters are stored in logical order: type the prefix, then the slot, then its vowel.

A template value can be a list. The first entry is the main form and the rest are shown as "also …", e.g. `'3ms': ['1*ְ2ָ3וֹ', '1*ְ2ָ3ָהוּ']`.

### A weak-verb class

Add a class to `src/data/verbClasses.ts`. Use `extends` to inherit everything you don't override:

```ts
'I-guttural': {
  label: 'I-guttural',
  extends: 'strong',
  conjugations: {
    'qal.impf': {
      '3ms': 'יַ1ֲ2ֹ3',        // יַעֲמֹד
      // …only the forms that differ
    },
  },
},
```

Then use `class: 'I-guttural'` on the verb.

### A one-off irregular form

Use `overrides` on the verb, keyed by conjugation ID (or object-suffix host ID) and PGN. Values are literal pointed forms, not templates:

```ts
{ root: 'כרת', class: 'strong', gloss: { base: 'cut', past: 'cut' },
  overrides: { 'qal.perf': { '2ms': 'כָּרַתָּ', '1cs': 'כָּרַתִּי' } } },
```

### A new stem or tense (Niphal, Piel, imperative, participle…)

1. In `src/data/conjugations.ts`, add a conjugation: an ID, stem and tense labels, the PGNs it has, and an English gloss rule:

   ```ts
   {
     id: 'niphal.perf',
     stem: 'Niphal',
     tense: 'Perfect',
     persons: PERFECT_PERSONS,
     gloss: (pgn, v) => `${SUBJECT[pgn]} was ${v.participle}`,
   },
   ```

2. Add templates for that ID to each verb class in `verbClasses.ts`, e.g. `'niphal.perf': { '3ms': 'נִ1ְ2*ַ3', … }`.

A deck ("Niphal perfect") and a Reference column appear automatically for every verb whose class has templates for the ID. A class without templates for it simply skips it.

To drill object suffixes on another form, add a host to `objectSuffixHosts` (e.g. `{ id: 'qal.perf.3fs', conjugation: 'qal.perf', pgn: '3fs' }`) and give the classes `objectSuffixes['qal.perf.3fs']` templates.

### Nouns with possessive suffixes

In `src/data/suffixes.ts`, `suffixedNouns`:

- **Unchanging stem:** `{ lemma: 'סוּס', gloss: 'horse', pluralGloss: 'horses', stem: 'סוּס', pluralStem: 'סוּס' }`. The stem gets the standard singular suffix set (`-ִי`, `-ְךָ`, …), and `pluralStem` gets the plural set (`-ַי`, `-ֶיךָ`, …). Leave out `pluralStem` to drill singular forms only.
- **Irregular noun:** give `forms.singular` / `forms.plural` explicitly (see `אָב`). Explicit forms also override single cells of a stem-based noun.

The suffix sets are `POSSESSIVE_SUFFIXES` in the same file. The leading `-` only gives the first vowel something to sit on in the editor; the engine strips it.

## Audio

Each card has a play button (`S`), and every Hebrew word in the Reference view can be clicked.

1. **Recorded files first.** `public/audio/manifest.json` maps pointed forms to files in `public/audio/`:

   ```json
   { "קָטַל": "qatal.mp3", "יִקְטֹל": "yiqtol.mp3" }
   ```

   Keys are NFC-normalized when loaded, so they match however the points were typed. Add files word by word; no code changes or rebuild are needed (the manifest is fetched at runtime). If a file fails to load, speech synthesis is used instead.
2. **Otherwise, speech synthesis** with a Hebrew voice (`he-IL`, e.g. macOS "Carmit"; add it under System Settings → Accessibility → Spoken Content → System voice → Manage Voices). If there is no Hebrew voice, play buttons are greyed out (except for words that have files).

Chrome workarounds in `src/audio/speaker.ts`:

- Every live utterance is held in a `Set` until it ends, because Chrome can garbage-collect an unreferenced utterance and then its queue hangs forever.
- After `cancel()`, the next `speak()` waits 150 ms, because Chrome can silently drop a `speak()` issued right after `cancel()`.
- A watchdog cancels and retries once if speech hasn't started after 2.5 s. If the retry also fails, the app shows a "Speech isn't responding" notice. That points to a system-level problem the page can't fix, such as a stuck OS audio output.

In dev mode the speaker is exposed as `window.__speaker`; `__speaker.log` shows the recent request/start/end/error events.

## Tests

`npm test` checks generated forms against textbook paradigms (full קָטַל perfect and imperfect, begadkefat in כָּתַב/זָכַר, shin dot in שָׁמַר, the full סוּס suffix paradigm singular and plural, object suffixes on קָטַל, final forms, dagesh forte, class inheritance and overrides) plus the SRS logic. Comparisons are made after NFC normalization.

`npm run check:browser` (with `npm run dev` running) drives real Chrome through a multi-card study session with audio on every card, a practice session, the Reference view, phone width and dark mode. Speech plays out loud. Add `--no-audio` to replace speech synthesis with a silent fake, which checks the app flow only.

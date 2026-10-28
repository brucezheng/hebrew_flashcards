import type { VerbEntry } from '../engine/types';

// Verbs: root + class. Every form is generated from the class templates.
export const verbs: VerbEntry[] = [
  { root: 'קטל', class: 'strong', gloss: { base: 'kill' }, meaning: 'kill (the textbook model verb)' },
  { root: 'שׁמר', class: 'strong', gloss: { base: 'keep', past: 'kept' }, meaning: 'keep, guard, watch, observe' },
  { root: 'כתב', class: 'strong', gloss: { base: 'write', past: 'wrote', participle: 'written' }, meaning: 'write' },
  { root: 'זכר', class: 'strong', gloss: { base: 'remember' }, meaning: 'remember, call to mind' },
];

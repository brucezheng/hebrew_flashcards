import type { Content } from '../engine/decks';
import { LEXICAL_FORM, OBJECT, SUBJECT, conjugations, objectSuffixHosts } from './conjugations';
import { nouns } from './nouns';
import { POSSESSIVE_SUFFIXES, POSSESSOR, suffixedNouns } from './suffixes';
import { verbClasses } from './verbClasses';
import { verbs } from './verbs';

export const content: Content = {
  nouns,
  verbs,
  verbClasses,
  conjugations,
  lexicalForm: LEXICAL_FORM,
  subject: SUBJECT,
  object: OBJECT,
  objectSuffixHosts,
  suffixedNouns,
  possessiveSuffixes: POSSESSIVE_SUFFIXES,
  possessor: POSSESSOR,
};

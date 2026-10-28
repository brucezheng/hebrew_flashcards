import type { NounEntry } from '../engine/types';

// High-frequency Biblical Hebrew nouns. One entry per card.
export const nouns: NounEntry[] = [
  {
    lemma: 'אֱלֹהִים',
    gloss: 'God, gods',
    translit: 'ʾĕlōhîm',
    gender: 'm',
    note: 'Plural in form. With singular verbs and adjectives it means "God"; with plural ones, "gods".',
  },
  { lemma: 'אָב', gloss: 'father', translit: 'ʾāḇ', gender: 'm', plural: 'אָבוֹת', note: 'Masculine noun with a -וֹת plural. With suffixes the stem is אֲבִי- (אָבִיו "his father").' },
  { lemma: 'אָדָם', gloss: 'man, humankind; Adam', translit: 'ʾāḏām', gender: 'm', note: 'Collective; no plural.' },
  { lemma: 'אִישׁ', gloss: 'man, husband', translit: 'ʾîš', gender: 'm', plural: 'אֲנָשִׁים', note: 'Irregular plural.' },
  { lemma: 'אִשָּׁה', gloss: 'woman, wife', translit: 'ʾiššâ', gender: 'f', plural: 'נָשִׁים', note: 'Irregular plural, feminine despite the -ִים ending.' },
  { lemma: 'אֶרֶץ', gloss: 'land, earth', translit: 'ʾereṣ', gender: 'f', plural: 'אֲרָצוֹת', note: 'Segolate noun. With the article: הָאָרֶץ.' },
  { lemma: 'בַּיִת', gloss: 'house, household', translit: 'bayiṯ', gender: 'm', plural: 'בָּתִּים', note: 'Irregular plural (bāttîm). Construct: בֵּית.' },
  { lemma: 'בֵּן', gloss: 'son', translit: 'bēn', gender: 'm', plural: 'בָּנִים' },
  { lemma: 'בַּת', gloss: 'daughter', translit: 'baṯ', gender: 'f', plural: 'בָּנוֹת' },
  { lemma: 'דָּבָר', gloss: 'word, thing, matter', translit: 'dāḇār', gender: 'm', plural: 'דְּבָרִים' },
  { lemma: 'דֶּרֶךְ', gloss: 'way, road', translit: 'dereḵ', gender: 'm/f', plural: 'דְּרָכִים', note: 'Segolate noun. Usually feminine, sometimes masculine.' },
  { lemma: 'הַר', gloss: 'mountain, hill country', translit: 'har', gender: 'm', plural: 'הָרִים' },
  { lemma: 'יָד', gloss: 'hand; power', translit: 'yāḏ', gender: 'f', plural: 'יָדַיִם', pluralLabel: 'dual', note: 'Dual יָדַיִם "(two) hands", used for body parts that come in pairs.' },
  { lemma: 'יוֹם', gloss: 'day', translit: 'yôm', gender: 'm', plural: 'יָמִים', note: 'Irregular plural.' },
  { lemma: 'מֶלֶךְ', gloss: 'king', translit: 'meleḵ', gender: 'm', plural: 'מְלָכִים', note: 'Segolate noun.' },
  { lemma: 'עִיר', gloss: 'city, town', translit: 'ʿîr', gender: 'f', plural: 'עָרִים', note: 'Feminine without a feminine ending; irregular plural with -ִים.' },
  { lemma: 'עַם', gloss: 'people, nation', translit: 'ʿam', gender: 'm', plural: 'עַמִּים', note: 'Doubled final consonant reappears before endings (עַמִּים, עַמִּי).' },
  { lemma: 'פָּנִים', gloss: 'face', translit: 'pānîm', gender: 'm', note: 'Plural in form only. לִפְנֵי "before" is built from it.' },
  { lemma: 'קוֹל', gloss: 'voice, sound', translit: 'qôl', gender: 'm', plural: 'קֹלוֹת', note: 'Masculine noun with a -וֹת plural.' },
  { lemma: 'שֵׁם', gloss: 'name', translit: 'šēm', gender: 'm', plural: 'שֵׁמוֹת', note: 'Masculine noun with a -וֹת plural.' },
];

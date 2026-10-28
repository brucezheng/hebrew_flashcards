import type { VerbClassDef } from '../engine/types';

// Paradigm templates per verb class. Syntax (see src/engine/template.ts):
//   1 2 3  radicals    *  dagesh lene if the radical is begadkefat    !  dagesh forte
// A value can be a list: the first template is the main form, the rest are
// alternatives shown as "also …".
export const verbClasses: Record<string, VerbClassDef> = {
  strong: {
    label: 'Strong verb',
    conjugations: {
      'qal.perf': {
        '3ms': '1*ָ2ַ3',
        '3fs': '1*ָ2ְ3ָה',
        '2ms': '1*ָ2ַ3ְתָּ',
        '2fs': '1*ָ2ַ3ְתְּ',
        '1cs': '1*ָ2ַ3ְתִּי',
        '3cp': '1*ָ2ְ3וּ',
        '2mp': '1*ְ2ַ3ְתֶּם',
        '2fp': '1*ְ2ַ3ְתֶּן',
        '1cp': '1*ָ2ַ3ְנוּ',
      },
      'qal.impf': {
        '3ms': 'יִ1ְ2*ֹ3',
        '3fs': 'תִּ1ְ2*ֹ3',
        '2ms': 'תִּ1ְ2*ֹ3',
        '2fs': 'תִּ1ְ2*ְ3ִי',
        '1cs': 'אֶ1ְ2*ֹ3',
        '3mp': 'יִ1ְ2*ְ3וּ',
        '3fp': 'תִּ1ְ2*ֹ3ְנָה',
        '2mp': 'תִּ1ְ2*ְ3וּ',
        '2fp': 'תִּ1ְ2*ֹ3ְנָה',
        '1cp': 'נִ1ְ2*ֹ3',
      },
    },
    objectSuffixes: {
      'qal.perf.3ms': {
        '1cs': '1*ְ2ָ3ַנִי',
        '2ms': '1*ְ2ָ3ְךָ',
        '2fs': '1*ְ2ָ3ֵךְ',
        '3ms': ['1*ְ2ָ3וֹ', '1*ְ2ָ3ָהוּ'],
        '3fs': '1*ְ2ָ3ָהּ',
        '1cp': '1*ְ2ָ3ָנוּ',
        '2mp': '1*ְ2ַ3ְכֶם',
        '2fp': '1*ְ2ַ3ְכֶן',
        '3mp': '1*ְ2ָ3ָם',
        '3fp': '1*ְ2ָ3ָן',
      },
      'qal.impf.3ms': {
        '1cs': ['יִ1ְ2*ְ3ֵנִי', 'יִ1ְ2*ְ3ֶנִּי'],
        '2ms': 'יִ1ְ2*ָ3ְךָ',
        '2fs': 'יִ1ְ2*ְ3ֵךְ',
        '3ms': ['יִ1ְ2*ְ3ֵהוּ', 'יִ1ְ2*ְ3ֶנּוּ'],
        '3fs': ['יִ1ְ2*ְ3ֶהָ', 'יִ1ְ2*ְ3ֶנָּה'],
        '1cp': 'יִ1ְ2*ְ3ֵנוּ',
        '2mp': 'יִ1ְ2*ָ3ְכֶם',
        '2fp': 'יִ1ְ2*ָ3ְכֶן',
        '3mp': 'יִ1ְ2*ְ3ֵם',
        '3fp': 'יִ1ְ2*ְ3ֵן',
      },
    },
  },
};

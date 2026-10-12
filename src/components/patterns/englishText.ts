import { flatten, type I18nKey, lookup } from '@jankrajewskiit/i18n';

import { dataEn } from '../../i18n/en';

const ENGLISH = flatten(dataEn);

export type StaticTranslate = (key: I18nKey) => string;

/** Bundled English text for exported constants that are built outside a component; only for messages without parameters. */
export const englishText: StaticTranslate = (key) => lookup(ENGLISH, key) ?? key;

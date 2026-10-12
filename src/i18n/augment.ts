import type { velvetMessages } from '@jankrajewskiit/ui';

import type { dataEn } from './en';

type ComposedDictionary = typeof dataEn & (typeof velvetMessages)['en'];

declare module '@jankrajewskiit/i18n' {
  interface I18nDictionary extends Pick<ComposedDictionary, keyof ComposedDictionary> {}
}

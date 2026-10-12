import {
  flatten,
  type I18nKey,
  lookup,
  type MessageParams,
  type RichMessageParams,
  useI18n,
} from '@jankrajewskiit/i18n';
import { velvetMessages } from '@jankrajewskiit/ui';
import type { JSX } from 'solid-js';

import { dataEn } from './en';

const ENGLISH_DEFAULTS = flatten({ ...velvetMessages.en, ...dataEn });

export const useTranslate = (): ((key: I18nKey, params?: MessageParams) => string) => {
  const { t, ts } = useI18n();
  return (key, params) => {
    const translated = ts(key, params);
    if (translated !== key) return translated;
    const template = lookup(ENGLISH_DEFAULTS, key);
    return template === undefined ? key : t(template, params);
  };
};

export const useTranslateRich = (): ((key: I18nKey, params?: RichMessageParams) => JSX.Element) => {
  const { ts, tx } = useI18n();
  return (key, params) => {
    if (ts(key) !== key) return tx(key, params);
    const template = lookup(ENGLISH_DEFAULTS, key);
    return template === undefined ? key : tx(template as I18nKey, params);
  };
};

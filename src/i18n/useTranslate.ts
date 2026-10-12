import { velvetMessages } from '@jankrajewskiit/ui';
import { createLibraryMessages } from '@jankrajewskiit/ui/common';

import { dataEn } from './en';

export const dataMessages = createLibraryMessages({ ...velvetMessages.en, ...dataEn });

export const useTranslate = dataMessages.useTranslate;
export const useTranslateRich = dataMessages.useTranslateRich;

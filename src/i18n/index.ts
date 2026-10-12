import { dataEn } from './en';
import { dataPl } from './pl';

// Declaration generation strips bare imports; keep dictionary augmentation reachable through a type export.
export type {} from './augment';

export const velvetDataMessages = { en: dataEn, pl: dataPl } as const;

import type { I18nKey } from '@jankrajewskiit/i18n';

import type { ColumnPin } from './columnManagerTypes';

export type ZoneKey = 'left' | 'mid' | 'right';

export interface Zone {
  pin: ColumnPin | null;
  zone: ZoneKey;
  labelKey: I18nKey;
  movedKey: I18nKey;
}

export const ZONES: Zone[] = [
  {
    pin: 'left',
    zone: 'left',
    labelKey: 'velvetData.columnManager.zoneLeft',
    movedKey: 'velvetData.columnManager.movedToLeft',
  },
  {
    pin: null,
    zone: 'mid',
    labelKey: 'velvetData.columnManager.zoneMid',
    movedKey: 'velvetData.columnManager.movedToMid',
  },
  {
    pin: 'right',
    zone: 'right',
    labelKey: 'velvetData.columnManager.zoneRight',
    movedKey: 'velvetData.columnManager.movedToRight',
  },
];

export const zoneOf = (pin: ColumnPin | null): ZoneKey => pin ?? 'mid';

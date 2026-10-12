import type { JSX } from 'solid-js';

import type { ColumnState } from './columnManagerTypes';
import type { GridColumn } from './dataGridTypes';

export const ROW_NUMBER_WIDTH = 44;
export const CHECK_WIDTH = 40;
export const DEFAULT_COLUMN_WIDTH = 160;
export const DEFAULT_GRID_HEIGHT = 360;
export const ESTIMATED_GRID_ROW_HEIGHT = 36;
export const DEFAULT_GRID_OVERSCAN = 6;

export const initialColumnState = <T extends object>(columns: GridColumn<T>[], stickyFirst: boolean): ColumnState[] => {
  const anyPinned = columns.some((c) => c.pin);
  return columns.map((c, i) => ({
    key: c.key,
    visible: !c.hidden,
    pin: c.pin ?? (!anyPinned && stickyFirst && i === 0 ? 'left' : null),
  }));
};

export const columnName = (c: { key: string; label: JSX.Element }) => (typeof c.label === 'string' ? c.label : c.key);

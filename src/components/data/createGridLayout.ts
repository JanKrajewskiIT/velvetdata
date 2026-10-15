import { type Accessor, createMemo, type JSX } from 'solid-js';

import type { GridColumn } from './dataGridTypes';
import { CHECK_WIDTH, DEFAULT_COLUMN_WIDTH, ROW_NUMBER_WIDTH } from './gridColumns';

export interface GridLayoutOptions<T extends object> {
  /** Visible columns in display order. */
  cols: Accessor<GridColumn<T>[]>;
  rowNumbers: Accessor<boolean | undefined>;
  selectable: Accessor<boolean | undefined>;
  widths: Accessor<Record<string, number>>;
  setWidth: (key: string, width: number) => void;
}

export interface GridLayout<T extends object> {
  widths: Accessor<Record<string, number>>;
  setWidth: (key: string, width: number) => void;
  /** Width of the row-number and checkbox columns. */
  leadWidth: () => number;
  template: () => string;
  pinEdge: (c: GridColumn<T>) => 'start' | 'end' | undefined;
  pinStyle: (c: GridColumn<T>) => JSX.CSSProperties | undefined;
  checkLeft: () => JSX.CSSProperties;
}

export const createGridLayout = <T extends object>(options: GridLayoutOptions<T>): GridLayout<T> => {
  const widths = options.widths;
  const setWidth = options.setWidth;
  const columnWidth = (key: string) => widths()[key] ?? DEFAULT_COLUMN_WIDTH;

  const leadWidth = () => (options.rowNumbers() ? ROW_NUMBER_WIDTH : 0) + (options.selectable() ? CHECK_WIDTH : 0);
  const pinLeft = createMemo(() => {
    const offsets = new Map<string, number>();
    let x = leadWidth();
    let last: string | undefined;
    options.cols().forEach((c) => {
      if (c.pin !== 'left') return;
      offsets.set(c.key, x);
      x += columnWidth(c.key);
      last = c.key;
    });
    return { offsets, last };
  });
  const template = () =>
    [
      options.rowNumbers() && `${ROW_NUMBER_WIDTH}px`,
      options.selectable() && `${CHECK_WIDTH}px`,
      ...options.cols().map((c) => `${columnWidth(c.key)}px`),
    ]
      .filter(Boolean)
      .join(' ');
  const pinRight = createMemo(() => {
    const offsets = new Map<string, number>();
    let x = 0;
    let first: string | undefined;
    [...options.cols()].reverse().forEach((column) => {
      if (column.pin !== 'right') return;
      offsets.set(column.key, x);
      x += columnWidth(column.key);
      first = column.key;
    });
    return { offsets, first };
  });
  const pinEdge = (c: GridColumn<T>) => {
    if (c.pin === 'left' && c.key === pinLeft().last) return 'start';
    if (c.pin === 'right' && c.key === pinRight().first) return 'end';
    return undefined;
  };
  const pinStyle = (c: GridColumn<T>): JSX.CSSProperties | undefined =>
    c.pin === 'left'
      ? { left: `${pinLeft().offsets.get(c.key) ?? 0}px` }
      : c.pin === 'right'
        ? { left: 'auto', right: `${pinRight().offsets.get(c.key) ?? 0}px` }
        : undefined;
  const checkLeft = (): JSX.CSSProperties => ({ left: `${options.rowNumbers() ? ROW_NUMBER_WIDTH : 0}px` });

  return { widths, setWidth, leadWidth, template, pinEdge, pinStyle, checkLeft };
};

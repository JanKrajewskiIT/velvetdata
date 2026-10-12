import { cellText, clamp, type RowKey, rowValue } from '@jankrajewskiit/ui/common';
import type { Accessor, JSX } from 'solid-js';

import type { GridActiveCell } from './createGridActiveCell';
import type { GridExpansion } from './createGridExpansion';
import type { GridSelection } from './createGridSelection';
import type { GridColumn } from './dataGridTypes';

const PAGE_ROWS = 10;

const warnClipboard = (error: unknown) => console.warn('DataGrid: copying the cell failed', error);

export interface GridKeyboardOptions<T extends object> {
  active: GridActiveCell;
  selection: GridSelection<T>;
  expansion: GridExpansion;
  /** Visible columns in display order. */
  cols: Accessor<GridColumn<T>[]>;
  /** Rows after search, filters and sort. */
  view: Accessor<T[]>;
  keyOf: (row: T, index: number) => RowKey;
  selectable: Accessor<boolean | undefined>;
  hasDetail: Accessor<boolean>;
}

export const createGridKeyboard =
  <T extends object>(options: GridKeyboardOptions<T>): JSX.EventHandler<HTMLDivElement, KeyboardEvent> =>
  (e) => {
    const { active } = options;
    if (active.edit() || !(e.target instanceof Element) || !e.target.matches('[role="gridcell"]')) return;
    const { row, col } = active.cell();
    const lastRow = () => options.view().length - 1;
    const lastCol = () => options.cols().length - 1;
    const column = options.cols()[col];
    const record = options.view()[row];
    if (!column || !record) return;
    const go = (nextRow: number, nextCol: number) => {
      e.preventDefault();
      active.focusCell(clamp(nextRow, 0, lastRow()), clamp(nextCol, 0, lastCol()));
    };
    if (e.key === 'ArrowDown') go(row + 1, col);
    else if (e.key === 'ArrowUp') go(row - 1, col);
    else if (e.key === 'ArrowRight') go(row, col + 1);
    else if (e.key === 'ArrowLeft') go(row, col - 1);
    else if (e.key === 'Home') go(e.ctrlKey ? 0 : row, 0);
    else if (e.key === 'End') go(e.ctrlKey ? lastRow() : row, lastCol());
    else if (e.key === 'PageDown') go(row + PAGE_ROWS, col);
    else if (e.key === 'PageUp') go(row - PAGE_ROWS, col);
    else if (e.key === ' ' && options.selectable()) {
      e.preventDefault();
      options.selection.toggleRow(options.keyOf(record, row));
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      if (column.editable) active.startEdit(row, col);
      else if (options.hasDetail()) options.expansion.toggleOpen(options.keyOf(record, row));
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && column.editable) {
      e.preventDefault();
      active.startEdit(row, col, '');
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && column.editable) {
      e.preventDefault();
      active.startEdit(row, col, e.key);
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      navigator.clipboard.writeText(cellText(rowValue(record, column.key))).catch(warnClipboard);
    }
  };

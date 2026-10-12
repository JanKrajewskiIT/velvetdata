import { type Accessor, createEffect, createMemo, createSignal, type Setter } from 'solid-js';

import { createFrameFocus } from '../../hooks/createFrameFocus';
import type { CellPosition, EditMove, GridColumn, GridRowChange } from './dataGridTypes';
import { cellText, type RowKey, rowValue } from './rowData';

export interface GridActiveCellOptions<T extends object> {
  getGrid: () => HTMLElement | undefined;
  cols: Accessor<GridColumn<T>[]>;
  view: Accessor<T[]>;
  rows: Accessor<T[]>;
  keyOf: (row: T, index: number) => RowKey;
  ensureVisible: (index: number) => void;
  onRowsChange: (rows: T[], change: GridRowChange) => void;
}

export interface GridActiveCell {
  cell: Accessor<CellPosition>;
  setCell: Setter<CellPosition>;
  edit: Accessor<CellPosition | null>;
  draft: Accessor<string>;
  setDraft: Setter<string>;
  focusCell: (row: number, col: number) => void;
  startEdit: (row: number, col: number, seed?: string) => void;
  commit: (move?: EditMove) => void;
  commitOnBlur: () => void;
  cancelEdit: (row: number, col: number) => void;
}

interface CellIdentity {
  row: RowKey;
  column: string;
}

export const createGridActiveCell = <T extends object>(options: GridActiveCellOptions<T>): GridActiveCell => {
  const [target, setTarget] = createSignal<CellIdentity>();
  const [editing, setEditing] = createSignal<CellIdentity>();
  const [draft, setDraft] = createSignal('');
  const focus = createFrameFocus(options.getGrid, { preventScroll: false });
  const rowsByKey = createMemo(() => new Map(options.view().map((row, index) => [options.keyOf(row, index), index])));
  const columnsByKey = createMemo(() => new Map(options.cols().map((column, index) => [column.key, index])));
  const locate = (identity: CellIdentity | undefined): CellPosition | null => {
    if (!identity) return null;
    const row = rowsByKey().get(identity.row);
    const col = columnsByKey().get(identity.column);
    return row === undefined || col === undefined ? null : { row, col };
  };
  const cell = createMemo(() => locate(target()) ?? { row: 0, col: 0 });
  const edit = createMemo(() => locate(editing()));
  createEffect(() => {
    const identity = editing();
    if (identity && (!edit() || !options.cols().find((column) => column.key === identity.column)?.editable))
      setEditing(undefined);
  });
  const identify = (row: number, col: number): CellIdentity | undefined => {
    const record = options.view()[row];
    const column = options.cols()[col];
    return record && column ? { row: options.keyOf(record, row), column: column.key } : undefined;
  };
  const setCell: Setter<CellPosition> = (next) => {
    const position = typeof next === 'function' ? next(cell()) : next;
    setTarget(identify(position.row, position.col));
    return position;
  };
  const focusCell = (row: number, col: number) => {
    if (!identify(row, col)) return;
    setCell({ row, col });
    options.ensureVisible(row);
    focus(`[data-rc="${row}-${col}"]`);
  };
  const startEdit = (row: number, col: number, seed?: string) => {
    const column = options.cols()[col];
    const record = options.view()[row];
    if (!column?.editable || !record) return;
    setCell({ row, col });
    options.ensureVisible(row);
    setEditing(identify(row, col));
    setDraft(seed ?? cellText(rowValue(record, column.key)));
  };
  const saveEdit = (): { identity: CellIdentity; position: CellPosition } | undefined => {
    const identity = editing();
    const current = edit();
    setEditing(undefined);
    if (!identity || !current) return;
    const column = options.cols().find((candidate) => candidate.key === identity.column);
    const sourceIndex = options.rows().findIndex((record, index) => options.keyOf(record, index) === identity.row);
    const record = options.rows()[sourceIndex];
    if (column?.editable && record) {
      const previous = rowValue(record, column.key);
      const parsed = Number(draft().replace(',', '.'));
      const value =
        column.type === 'number' ? (draft().trim() && Number.isFinite(parsed) ? parsed : previous) : draft();
      if (value !== previous)
        options.onRowsChange(
          options.rows().map((row, index) => (index === sourceIndex ? { ...row, [column.key]: value } : row)),
          { row: identity.row, key: column.key, value },
        );
    }
    return { identity, position: current };
  };
  const commit = (move: EditMove = 'stay') => {
    const saved = saveEdit();
    if (!saved) return;
    const position = locate(saved.identity) ?? saved.position;
    const row = Math.max(0, Math.min(options.view().length - 1, position.row + (move === 'down' ? 1 : 0)));
    const columnStep = move === 'right' ? 1 : move === 'left' ? -1 : 0;
    const col = Math.max(0, Math.min(options.cols().length - 1, position.col + columnStep));
    focusCell(row, col);
  };
  const commitOnBlur = () => {
    saveEdit();
  };
  const cancelEdit = (row: number, col: number) => {
    setEditing(undefined);
    focusCell(row, col);
  };
  return { cell, setCell, edit, draft, setDraft, focusCell, startEdit, commit, commitOnBlur, cancelEdit };
};

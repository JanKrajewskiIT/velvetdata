import {
  cellText,
  createFrameFocus,
  createOperation,
  reportAsyncError,
  type RowKey,
  rowValue,
} from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createMemo, createSignal, type Setter } from 'solid-js';

import type { CellPosition, GridColumn, GridRowChange } from './dataGridTypes';
import { focusOutsideGrid } from './focusOutsideGrid';
import type { EditMove } from './gridEditorTypes';
import { queryNumber } from './queryNumber';

export interface GridActiveCellOptions<T extends object> {
  getGrid: () => HTMLElement | undefined;
  cols: Accessor<GridColumn<T>[]>;
  view: Accessor<T[]>;
  rows: Accessor<T[]>;
  keyOf: (row: T, index: number) => RowKey;
  ensureVisible: (index: number) => void;
  onRowsChange: (rows: T[], change: GridRowChange) => void | Promise<void>;
  onEditError: (error: unknown, change: GridRowChange) => void;
  invalidNumberText: Accessor<string>;
  saveErrorText: Accessor<string>;
  dataKey: Accessor<string | number | undefined>;
  canEdit: Accessor<boolean>;
}

export interface GridActiveCell {
  cell: Accessor<CellPosition>;
  setCell: Setter<CellPosition>;
  edit: Accessor<CellPosition | null>;
  draft: Accessor<string>;
  setDraft: Setter<string>;
  pending: Accessor<boolean>;
  error: Accessor<string | undefined>;
  canEdit: (column: number) => boolean;
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
  const [error, setError] = createSignal<string>();
  const operation = createOperation({ concurrency: 'single-flight' });
  const focus = createFrameFocus(options.getGrid, { preventScroll: false });
  const rowsByKey = createMemo(() => new Map(options.view().map((row, index) => [options.keyOf(row, index), index])));
  const columnsByKey = createMemo(() => new Map(options.cols().map((column, index) => [column.key, index])));
  const canEdit = (column: number) => options.canEdit() && !!options.cols()[column]?.editable;
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
    if (
      identity &&
      (!options.canEdit() || !edit() || !options.cols()[columnsByKey().get(identity.column) ?? -1]?.editable)
    ) {
      operation.invalidate();
      setEditing(undefined);
      setError(undefined);
    }
  });
  let dataKey = options.dataKey();
  createEffect(() => {
    const next = options.dataKey();
    if (next === dataKey) return;
    dataKey = next;
    operation.invalidate();
    setEditing(undefined);
    setError(undefined);
    setTarget(undefined);
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
    if (!canEdit(col) || operation.busy() || !column || !record) return;
    setCell({ row, col });
    options.ensureVisible(row);
    setEditing(identify(row, col));
    setError(undefined);
    setDraft(seed ?? cellText(rowValue(record, column.key)));
  };
  const saveEdit = async (): Promise<{ identity: CellIdentity; position: CellPosition } | undefined> => {
    if (!options.canEdit() || operation.busy()) return;
    const identity = editing();
    const current = edit();
    if (!identity || !current) return;
    const column = options.cols()[columnsByKey().get(identity.column) ?? -1];
    const sourceIndex = options.rows().findIndex((record, index) => options.keyOf(record, index) === identity.row);
    const record = options.rows()[sourceIndex];
    if (!column?.editable || !record) return;
    let value: unknown;
    try {
      value = column.parseValue
        ? column.parseValue(draft(), record)
        : column.type === 'number'
          ? queryNumber(draft())
          : draft();
    } catch (cause) {
      setError(options.saveErrorText());
      options.onEditError(cause, { row: identity.row, key: column.key, value: draft() });
      return;
    }
    if (!column.parseValue && column.type === 'number' && value === undefined) {
      setError(options.invalidNumberText());
      return;
    }
    const change: GridRowChange = { row: identity.row, key: column.key, value };
    const run = operation.begin();
    if (!run) return;
    try {
      const invalid = await column.validate?.(value, record);
      if (!run.isCurrent()) return;
      if (invalid) {
        setError(invalid);
        return;
      }
      if (value !== rowValue(record, column.key)) {
        const rows = options.rows();
        const index = rows.findIndex((row, at) => options.keyOf(row, at) === identity.row);
        if (rows[index] !== record) {
          setError(options.saveErrorText());
          return;
        }
        await options.onRowsChange(
          rows.map((row, at) => (at === index ? { ...row, [column.key]: value } : row)),
          change,
        );
      }
      if (!run.isCurrent()) return;
      setEditing(undefined);
      setError(undefined);
      return { identity, position: current };
    } catch (cause) {
      if (run.isCurrent()) {
        setError(options.saveErrorText());
        options.onEditError(cause, change);
      }
    } finally {
      run.finish();
    }
  };
  const saveAndMove = async (move?: EditMove) => {
    const saved = await saveEdit();
    if (!saved) return;
    if (move === undefined) return;
    const grid = options.getGrid();
    const active = grid?.ownerDocument.activeElement;
    if (!grid || (active && active !== grid.ownerDocument.body && !grid.contains(active))) return;
    const position = locate(saved.identity) ?? saved.position;
    const columnStep = move === 'right' ? 1 : move === 'left' ? -1 : 0;
    const lastColumn = options.cols().length - 1;
    let row = position.row + (move === 'down' ? 1 : 0);
    let col = position.col + columnStep;
    if (col > lastColumn) {
      row++;
      col = 0;
    }
    if (col < 0) {
      row--;
      col = lastColumn;
    }
    if (columnStep && (row < 0 || row >= options.view().length)) {
      focusOutsideGrid(grid, columnStep);
      return;
    }
    row = Math.max(0, Math.min(options.view().length - 1, row));
    focusCell(row, col);
  };
  const commit = (move: EditMove = 'stay') => {
    void saveAndMove(move).catch(reportAsyncError);
  };
  const commitOnBlur = () => {
    void saveAndMove().catch(reportAsyncError);
  };
  const cancelEdit = (row: number, col: number) => {
    operation.invalidate();
    setEditing(undefined);
    setError(undefined);
    focusCell(row, col);
  };
  const updateDraft: Setter<string> = (next) => {
    if (operation.busy()) return draft();
    setError(undefined);
    return setDraft(next);
  };
  return {
    cell,
    setCell,
    edit,
    draft,
    setDraft: updateDraft,
    pending: operation.busy,
    error,
    canEdit,
    focusCell,
    startEdit,
    commit,
    commitOnBlur,
    cancelEdit,
  };
};

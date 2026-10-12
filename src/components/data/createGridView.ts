import { type Accessor, createMemo, createSignal, untrack } from 'solid-js';

import { createControllable } from '../../hooks/createControllable';
import type { QueryGroup } from '../patterns/queryModel';
import { applyColumns } from './applyColumns';
import type { ColumnState } from './columnManagerTypes';
import { sameColumnState } from './columnState';
import { createGridPersistence } from './createGridPersistence';
import type { DataGridProps, GridColumn } from './dataGridTypes';
import { countActiveRules, matchesQuery } from './gridFilter';
import { parseGridView, serializeGridView } from './gridViewCodec';
import { defaultGridView } from './gridViewHelpers';
import { gridColumnWidth, normalizeGridView } from './gridViewState';
import type { GridViewState } from './gridViewTypes';
import { cellText, compareValues, type RowSort, rowValue } from './rowData';
import { sameGridView } from './sameGridView';

export interface GridView<T extends object> {
  cols: Accessor<GridColumn<T>[]>;
  rows: Accessor<T[]>;
  state: Accessor<GridViewState>;
  widths: Accessor<Record<string, number>>;
  search: Accessor<string>;
  setSearch: (search: string) => void;
  query: Accessor<QueryGroup | undefined>;
  setQuery: (query: QueryGroup | undefined) => void;
  columnState: Accessor<ColumnState[]>;
  setColumnState: (columns: ColumnState[]) => void;
  sort: Accessor<RowSort | null>;
  setSort: (sort: RowSort | null) => void;
  setWidth: (key: string, width: number) => void;
  resetWidth: (key: string) => void;
  initial: Accessor<GridViewState>;
  isDefault: Accessor<boolean>;
  activeFilters: Accessor<number>;
  error: Accessor<Error | undefined>;
  reportError: (cause: unknown) => void;
  reset: () => void;
  importSettings: (json: string) => boolean;
  exportSettings: () => string;
}

export const createGridView = <T extends object>(config: Accessor<DataGridProps<T>>): GridView<T> => {
  const defaults = untrack(() => ({ ...defaultGridView(config().columns, config()), ...config().defaultView }));
  const normalize = (state: Partial<GridViewState>) =>
    normalizeGridView(state, config().columns, config().stickyFirst ?? true, config().filterFields ?? []);
  const [raw, setRaw] = createControllable<GridViewState>({
    value: () => config().view,
    defaultValue: untrack(() => normalize(defaults)),
    onChange: (next) => config().onViewChange?.(next),
  });
  const state = createMemo(() => normalize(raw()));
  const initial = createMemo(() => normalize(defaults));
  const isDefault = () => sameGridView(state(), initial());
  const search = createMemo(() => state().search);
  const query = createMemo(() => state().query);
  const sort = createMemo(() => state().sort, undefined, {
    equals: (previous, next) => previous?.key === next?.key && previous?.dir === next?.dir,
  });
  const columnState = createMemo(() => state().columns, undefined, { equals: sameColumnState });
  const widths = createMemo(
    () =>
      Object.fromEntries(
        config().columns.map((column) => [column.key, gridColumnWidth(column, state().widths[column.key])]),
      ),
    undefined,
    {
      equals: (previous, next) =>
        Object.keys(previous).length === Object.keys(next).length &&
        Object.entries(previous).every(([key, value]) => Object.hasOwn(next, key) && next[key] === value),
    },
  );
  const [error, setError] = createSignal<Error>();
  const reportError = (cause: unknown) => {
    const next = cause instanceof Error ? cause : new Error('Grid view settings could not be applied.');
    setError(next);
    config().onViewError?.(next);
  };
  const replace = (next: Partial<GridViewState>) => {
    setError(undefined);
    setRaw(normalize(next));
  };
  const update = (next: Partial<GridViewState>) => replace({ ...state(), ...next });
  const cols = createMemo(() => applyColumns(config().columns, columnState()));
  const activeFilters = () => {
    const current = query();
    return current ? countActiveRules(current) : 0;
  };
  const rows = createMemo(() => {
    let out = config().rows;
    if (!config().manualFiltering) {
      const needle = search().trim().toLowerCase();
      if (needle)
        out = out.filter((row) =>
          cols().some((column) =>
            column.filterFn
              ? column.filterFn(row, needle)
              : cellText(column.filterAccessor ? column.filterAccessor(row) : rowValue(row, column.key))
                  .toLowerCase()
                  .includes(needle),
          ),
        );
      const currentQuery = query();
      if (currentQuery && activeFilters())
        out = out.filter((row) =>
          matchesQuery(currentQuery, row, (key) => {
            const column = config().columns.find((candidate) => candidate.key === key);
            return column?.filterAccessor ? column.filterAccessor(row) : rowValue(row, key);
          }),
        );
    }
    const currentSort = sort();
    const column = currentSort && config().columns.find((candidate) => candidate.key === currentSort.key);
    if (!config().manualSorting && currentSort && column) {
      const value = (row: T) => (column.sortAccessor ? column.sortAccessor(row) : rowValue(row, column.key));
      out = [...out].sort(
        (a, b) =>
          (column.sortFn ? column.sortFn(a, b) : compareValues(value(a), value(b))) *
          (currentSort.dir === 'asc' ? 1 : -1),
      );
    }
    return out;
  });
  createGridPersistence({ key: () => config().persistenceKey, view: state, restore: replace, onError: reportError });
  return {
    cols,
    rows,
    state,
    widths,
    activeFilters,
    error,
    reportError,
    search,
    setSearch: (search) => update({ search }),
    query,
    setQuery: (query) => update({ query }),
    columnState,
    setColumnState: (columns) => update({ columns }),
    sort,
    setSort: (sort) => update({ sort }),
    setWidth: (key, width) => update({ widths: { ...state().widths, [key]: width } }),
    resetWidth: (key) => {
      const widths = Object.fromEntries(Object.entries(state().widths).filter(([columnKey]) => columnKey !== key));
      update({ widths });
    },
    initial,
    isDefault,
    reset: () => replace(defaults),
    importSettings: (json) => {
      let next: GridViewState;
      try {
        next = parseGridView(json);
      } catch (cause) {
        reportError(cause);
        return false;
      }
      replace(next);
      return true;
    },
    exportSettings: () => serializeGridView(state()),
  };
};

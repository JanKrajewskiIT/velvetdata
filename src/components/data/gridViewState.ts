import { columnWidthBounds, constrainColumnWidth } from '../../utils/columnWidth';
import type { QueryField, QueryGroup, QueryNode } from '../patterns/queryModel';
import { isQueryGroup, queryOperatorValues } from '../patterns/queryModel';
import { reconcileColumnState } from './columnState';
import type { GridColumn } from './dataGridTypes';
import { DEFAULT_COLUMN_WIDTH, initialColumnState } from './gridColumns';
import type { GridViewState } from './gridViewTypes';

export const gridColumnWidth = <T extends object>(column: GridColumn<T>, width?: number): number => {
  const value = Number.isFinite(width) ? (width ?? DEFAULT_COLUMN_WIDTH) : (column.width ?? DEFAULT_COLUMN_WIDTH);
  return constrainColumnWidth(
    Number.isFinite(value) ? value : DEFAULT_COLUMN_WIDTH,
    columnWidthBounds(column.minWidth, column.maxWidth),
  );
};

const reconcileQuery = (group: QueryGroup, fields: QueryField[]): QueryGroup => {
  let changed = false;
  const rules: QueryNode[] = [];
  for (const node of group.rules) {
    if (isQueryGroup(node)) {
      const next = reconcileQuery(node, fields);
      if (next !== node) changed = true;
      rules.push(next);
      continue;
    }
    const field = fields.find((candidate) => candidate.key === node.field);
    if (field && queryOperatorValues(field).includes(node.op)) rules.push(node);
    else changed = true;
  }
  return changed ? { ...group, rules } : group;
};

/** Reconciles settings against the current schema without losing the remaining columns' order. */
export const normalizeGridView = <T extends object>(
  state: Partial<GridViewState>,
  columns: GridColumn<T>[],
  stickyFirst: boolean,
  fields: QueryField[],
): GridViewState => {
  const defaults = initialColumnState(columns, stickyFirst);
  const definitions = new Map(columns.map((column) => [column.key, column]));
  const managed = columns.map((column) => ({
    ...column,
    visible: !column.hidden,
    pin: defaults.find((entry) => entry.key === column.key)?.pin ?? undefined,
  }));
  const sortedColumn = state.sort ? definitions.get(state.sort.key) : undefined;
  return {
    search: state.search ?? '',
    query: state.query ? reconcileQuery(state.query, fields) : undefined,
    sort: sortedColumn && sortedColumn.sortable !== false ? (state.sort ?? null) : null,
    columns: reconcileColumnState(state.columns ?? [], managed, 1),
    widths: Object.fromEntries(
      columns.flatMap((column) => {
        const width = state.widths?.[column.key];
        return typeof width === 'number' && Number.isFinite(width)
          ? [[column.key, gridColumnWidth(column, width)]]
          : [];
      }),
    ),
  };
};

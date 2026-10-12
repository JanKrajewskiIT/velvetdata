import { emptyQuery, type QueryField } from '../patterns/queryModel';
import type { GridColumn } from './dataGridTypes';
import { parseGridView } from './gridViewCodec';
import { normalizeGridView } from './gridViewState';
import type { GridViewState } from './gridViewTypes';

export interface GridViewOptions {
  stickyFirst?: boolean;
  filterFields?: QueryField[];
}

export const defaultGridView = <T extends object>(
  columns: GridColumn<T>[],
  options: GridViewOptions = {},
): GridViewState =>
  normalizeGridView(
    { query: options.filterFields ? emptyQuery(options.filterFields) : undefined },
    columns,
    options.stickyFirst ?? true,
    options.filterFields ?? [],
  );

/** Rejects malformed settings with the same bounded codec used for JSON imports. */
export const reconcileGridView = <T extends object>(
  view: unknown,
  columns: GridColumn<T>[],
  options: GridViewOptions = {},
): GridViewState => {
  const base = defaultGridView(columns, options);
  if (view == null) return base;
  if (typeof view !== 'object' || Array.isArray(view)) throw new Error('Invalid grid view settings.');
  const input = view as Record<string, unknown>;
  const query = input.query === null ? undefined : (input.query ?? base.query);
  const parsed = parseGridView(JSON.stringify({ version: 1, view: { ...base, ...input, query } }));
  return normalizeGridView(parsed, columns, options.stickyFirst ?? true, options.filterFields ?? []);
};

import type { RowSort } from '@jankrajewskiit/ui/common';

import type { QueryGroup, QueryNode } from '../patterns/queryModel';
import { QUERY_OPERATOR_VALUES } from '../patterns/queryModel';
import type { ColumnState } from './columnManagerTypes';
import type { GridViewState } from './gridViewTypes';

export const MAX_GRID_VIEW_BYTES = 1_000_000;
const MAX_NODES = 500;
const MAX_DEPTH = 16;

const invalidView = (): never => {
  throw new Error('Invalid or unsupported grid view settings.');
};
const recordOf = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalidView();
const textOf = (value: unknown): string =>
  typeof value === 'string' && value.length <= 10_000 ? value : invalidView();
const pinOf = (value: unknown): ColumnState['pin'] =>
  value === null || value === 'left' || value === 'right' ? value : invalidView();

const parseQuery = (value: unknown): QueryGroup => {
  const ids = new Set<string>();
  let count = 0;
  const nodeOf = (input: unknown, depth: number): QueryNode => {
    if (++count > MAX_NODES || depth > MAX_DEPTH) return invalidView();
    const node = recordOf(input);
    const id = textOf(node.id);
    if (!id || ids.has(id)) return invalidView();
    ids.add(id);
    if ('rules' in node) {
      if (!Array.isArray(node.rules) || (node.combinator !== 'and' && node.combinator !== 'or')) return invalidView();
      return { id, combinator: node.combinator, rules: node.rules.map((child) => nodeOf(child, depth + 1)) };
    }
    const op = textOf(node.op);
    if (!QUERY_OPERATOR_VALUES.includes(op)) return invalidView();
    return { id, field: textOf(node.field), op, value: textOf(node.value) };
  };
  const query = nodeOf(value, 0);
  return 'rules' in query ? query : invalidView();
};

/** Versioned JSON containing settings only. */
export const serializeGridView = (view: GridViewState): string => {
  const json = JSON.stringify({ version: 1, view }, null, 2);
  parseGridView(json);
  return json;
};

/** Validates the complete payload before callers reconcile it against their current columns and fields. */
export const parseGridView = (json: string): GridViewState => {
  if (json.length > MAX_GRID_VIEW_BYTES || new TextEncoder().encode(json).byteLength > MAX_GRID_VIEW_BYTES)
    return invalidView();
  const envelope = recordOf(JSON.parse(json) as unknown);
  if (envelope.version !== 1) return invalidView();
  const view = recordOf(envelope.view);
  if (!Array.isArray(view.columns) || view.columns.length > MAX_NODES) return invalidView();
  const keys = new Set<string>();
  const columns = view.columns.map((input): ColumnState => {
    const column = recordOf(input);
    const key = textOf(column.key);
    if (!key || keys.has(key) || typeof column.visible !== 'boolean') return invalidView();
    keys.add(key);
    return { key, visible: column.visible, pin: pinOf(column.pin) };
  });
  let sort: RowSort | null = null;
  if (view.sort !== null) {
    const input = recordOf(view.sort);
    if (input.dir !== 'asc' && input.dir !== 'desc') return invalidView();
    sort = { key: textOf(input.key), dir: input.dir };
  }
  const entries = Object.entries(recordOf(view.widths));
  if (entries.length > MAX_NODES) return invalidView();
  const widths = Object.fromEntries(
    entries.map(([key, width]) => {
      if (key.length > 10_000 || typeof width !== 'number' || !Number.isFinite(width) || width <= 0)
        return invalidView();
      return [key, width];
    }),
  );
  return {
    search: textOf(view.search),
    query: view.query === undefined ? undefined : parseQuery(view.query),
    columns,
    sort,
    widths,
  };
};

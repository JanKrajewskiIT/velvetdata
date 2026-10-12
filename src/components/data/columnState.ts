import { columnCapabilities } from './columnCapabilities';
import type { ColumnState, ManagedColumn } from './columnManagerTypes';

export const initialManagedColumns = (columns: ManagedColumn[]): ColumnState[] =>
  columns.map((column) => ({ key: column.key, visible: column.visible !== false, pin: column.pin ?? null }));

export const sameColumnState = (previous: ColumnState[], next: ColumnState[]): boolean =>
  previous.length === next.length &&
  previous.every((column, index) => {
    const current = next[index];
    return current?.key === column.key && current.visible === column.visible && current.pin === column.pin;
  });

/** Reconcile an existing layout against current definitions, preserving allowed user choices. */
export const reconcileColumnState = (saved: ColumnState[], columns: ManagedColumn[], minVisible = 0): ColumnState[] => {
  const defaults = initialManagedColumns(columns);
  const definitions = new Map(columns.map((column) => [column.key, column]));
  const byKey = new Map(defaults.map((column) => [column.key, column]));
  const seen = new Set<string>();
  const ordered: ColumnState[] = [];
  for (const entry of [...saved, ...defaults]) {
    const column = definitions.get(entry.key);
    const initial = byKey.get(entry.key);
    if (!column || !initial || seen.has(entry.key)) continue;
    seen.add(entry.key);
    const capabilities = columnCapabilities(column);
    ordered.push({
      key: entry.key,
      visible: capabilities.hide ? entry.visible : initial.visible,
      pin: capabilities.pin ? entry.pin : initial.pin,
    });
  }
  defaults.forEach((initial, index) => {
    const column = definitions.get(initial.key);
    if (!column || columnCapabilities(column).move) return;
    const position = ordered.findIndex((entry) => entry.key === initial.key);
    if (position < 0) return;
    const fixed = ordered.splice(position, 1)[0];
    if (fixed) ordered.splice(index, 0, fixed);
  });
  const minimum = Math.min(ordered.length, Math.max(0, Math.floor(minVisible)));
  let visible = ordered.filter((column) => column.visible).length;
  ordered.forEach((column) => {
    if (!column.visible && visible < minimum) {
      column.visible = true;
      visible++;
    }
  });
  return ordered;
};

export type RowKey = string | number;

export interface RowSort {
  key: string;
  dir: 'asc' | 'desc';
}

/** Reads a column value from a record row; the row shape is owned by the consumer's column keys. */
export const rowValue = (row: object, key: string): unknown => (row as Record<string, unknown>)[key];

/** The row's unique key, falling back to `fallback` when the key field holds no string or number. */
export const rowId = (row: object, key: string, fallback: RowKey): RowKey => {
  const value = rowValue(row, key);
  return typeof value === 'string' || typeof value === 'number' ? value : fallback;
};

/** Text for a cell value: strings, numbers and dates render as text; `null`, `undefined`, booleans and objects render as nothing. */
export const cellText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  return '';
};

/** Numbers compare numerically, everything else by natural-order string comparison. */
export const compareValues = (a: unknown, b: unknown): number =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : cellText(a).localeCompare(cellText(b), undefined, { numeric: true });

/** asc → desc → off, restarting at asc when another column is chosen. */
export const nextSort = (current: RowSort | null, key: string): RowSort | null => {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  return current.dir === 'asc' ? { key, dir: 'desc' } : null;
};

export const sortRows = <T extends object>(rows: T[], get: (row: T) => unknown, dir: RowSort['dir']): T[] => {
  const sorted = [...rows].sort((a, b) => compareValues(get(a), get(b)));
  return dir === 'desc' ? sorted.reverse() : sorted;
};

/** Numbers become px lengths (Solid does not append units); strings pass through. */
export const cssLength = (value: number | string | undefined): string | undefined =>
  typeof value === 'number' ? `${value}px` : value;

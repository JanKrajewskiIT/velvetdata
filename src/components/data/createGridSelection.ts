import { createControllable, type RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createMemo } from 'solid-js';

export interface GridSelectionOptions<T extends object> {
  selected: Accessor<RowKey[] | undefined>;
  onChange: (keys: RowKey[]) => void;
  rows: Accessor<T[]>;
  /** Rows after search, filters and sort. */
  view: Accessor<T[]>;
  keyOf: (row: T, index: number) => RowKey;
}

export interface GridSelection<T extends object> {
  selectedSet: Accessor<ReadonlySet<RowKey>>;
  selectedRows: () => T[];
  allOn: () => boolean;
  someOn: () => boolean;
  toggleAll: () => void;
  toggleRow: (key: RowKey) => void;
  clear: () => void;
}

export const createGridSelection = <T extends object>(options: GridSelectionOptions<T>): GridSelection<T> => {
  const [selection, setSelection] = createControllable<RowKey[]>({
    value: options.selected,
    defaultValue: [],
    onChange: options.onChange,
  });
  const selectedSet = createMemo(() => new Set(selection()));
  const viewKeys = () => options.view().map(options.keyOf);
  const allOn = () => options.view().length > 0 && viewKeys().every((k) => selectedSet().has(k));
  const someOn = () => !allOn() && viewKeys().some((k) => selectedSet().has(k));
  const selectedRows = () => options.rows().filter((r, i) => selectedSet().has(options.keyOf(r, i)));
  const toggleAll = () => {
    const next = new Set(selectedSet());
    const remove = allOn();
    viewKeys().forEach((key) => (remove ? next.delete(key) : next.add(key)));
    setSelection([...next]);
  };
  const toggleRow = (key: RowKey) => {
    const next = new Set(selectedSet());
    if (!next.delete(key)) next.add(key);
    setSelection([...next]);
  };
  const clear = () => setSelection([]);

  return { selectedSet, selectedRows, allOn, someOn, toggleAll, toggleRow, clear };
};

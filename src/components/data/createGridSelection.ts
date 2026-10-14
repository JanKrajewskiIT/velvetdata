import { createControllable, type RowKey, toggleKey, toggleKeyScope } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createMemo, on } from 'solid-js';

export interface GridSelectionOptions<T extends object> {
  selected: Accessor<RowKey[] | undefined>;
  onChange: (keys: RowKey[]) => void;
  rows: Accessor<T[]>;
  /** Rows after search, filters and sort. */
  view: Accessor<T[]>;
  keyOf: (row: T, index: number) => RowKey;
  defaultSelected?: RowKey[];
  dataKey: Accessor<string | number | undefined>;
}

export interface GridSelection<T extends object> {
  selectedSet: Accessor<ReadonlySet<RowKey>>;
  selectedRows: () => T[];
  selectedKeys: Accessor<readonly RowKey[]>;
  allOn: () => boolean;
  someOn: () => boolean;
  toggleAll: () => void;
  toggleRow: (key: RowKey) => void;
  clear: () => void;
}

export const createGridSelection = <T extends object>(options: GridSelectionOptions<T>): GridSelection<T> => {
  const [selection, setSelection] = createControllable<RowKey[]>({
    value: options.selected,
    defaultValue: options.defaultSelected ?? [],
    onChange: options.onChange,
  });
  createEffect(on(options.dataKey, () => setSelection([]), { defer: true }));
  const selectedSet = createMemo(() => new Set(selection()));
  const viewKeys = createMemo(() => options.view().map(options.keyOf));
  const allOn = () => options.view().length > 0 && viewKeys().every((k) => selectedSet().has(k));
  const someOn = () => !allOn() && viewKeys().some((k) => selectedSet().has(k));
  const selectedRows = createMemo(() => options.rows().filter((r, i) => selectedSet().has(options.keyOf(r, i))));
  const selectedKeys = createMemo(() => [...selectedSet()]);
  const toggleAll = () => {
    setSelection(toggleKeyScope(selection(), viewKeys()));
  };
  const toggleRow = (key: RowKey) => {
    setSelection(toggleKey(selection(), key));
  };
  const clear = () => setSelection([]);

  return { selectedSet, selectedKeys, selectedRows, allOn, someOn, toggleAll, toggleRow, clear };
};

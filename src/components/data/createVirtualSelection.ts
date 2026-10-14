import { createControllable, createRowIdentity, type RowKey, rowValue, toggleKey } from '@jankrajewskiit/ui/common';
import { createEffect, on } from 'solid-js';

import { createVirtualKeys } from './createVirtualKeys';
import type { VirtualListConfig } from './virtualListTypes';

const identityOf = (item: unknown): RowKey | undefined => {
  if (typeof item !== 'object' || item === null) return undefined;
  const id = rowValue(item, 'id') ?? rowValue(item, 'key');
  return typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id)) ? id : undefined;
};

export const createVirtualSelection = <T>(p: VirtualListConfig<T>) => {
  const objectIdentity = createRowIdentity<object>(
    () => 'id',
    () => undefined,
  );
  const [selected, setSelected] = createControllable<RowKey | RowKey[]>({
    value: () => p.selected,
    defaultValue: p.defaultSelected ?? [],
    onChange: (next) => p.onSelectionChange?.(next),
  });
  const multiple = () =>
    p.selectionMode === 'multiple' || (p.selectionMode === undefined && Array.isArray(p.selected ?? p.defaultSelected));
  createEffect(
    on(
      () => p.dataKey,
      () => setSelected([]),
      { defer: true },
    ),
  );
  const keys = createVirtualKeys(
    () => p.items,
    (item, i) =>
      p.getKey?.(item, i) ?? identityOf(item) ?? (typeof item === 'object' && item !== null ? objectIdentity(item) : i),
    'VirtualList',
  );

  const isSelected = (i: number) => {
    const key = keys.keys()[i];
    if (key === undefined) return false;
    const current = selected();
    return Array.isArray(current) ? current.includes(key) : current === key;
  };

  const select = (i: number, item: T) => {
    const key = keys.keys()[i];
    if (p.selectable && key !== undefined) {
      const current = selected();
      setSelected(multiple() ? toggleKey(Array.isArray(current) ? current : [current], key) : key);
      p.onSelect?.(key, item);
    }
  };

  const multiselectable = () => (p.selectable && multiple() ? true : undefined);

  return { keys, isSelected, select, multiselectable } as const;
};

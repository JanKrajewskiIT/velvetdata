import { type RowKey, rowValue } from '@jankrajewskiit/ui/common';

import { createVirtualKeys } from './createVirtualKeys';
import type { VirtualListConfig } from './virtualListTypes';

const identityOf = (item: unknown): RowKey | undefined => {
  if (typeof item !== 'object' || item === null) return undefined;
  const id = rowValue(item, 'id') ?? rowValue(item, 'key');
  return typeof id === 'string' || typeof id === 'number' ? id : undefined;
};

export const createVirtualSelection = <T>(p: VirtualListConfig<T>) => {
  const keys = createVirtualKeys(
    () => p.items,
    (item, i) => p.getKey?.(item, i) ?? identityOf(item) ?? i,
    'VirtualList',
  );

  const isSelected = (i: number) => {
    const key = keys.keys()[i];
    if (key === undefined) return false;
    return Array.isArray(p.selected) ? p.selected.some((k) => k === key) : p.selected === key;
  };

  const select = (i: number, item: T) => {
    const key = keys.keys()[i];
    if (p.selectable && key !== undefined) p.onSelect?.(key, item);
  };

  const multiselectable = () => (p.selectable && Array.isArray(p.selected) ? true : undefined);

  return { keys, isSelected, select, multiselectable } as const;
};

import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createMemo } from 'solid-js';

export const createVirtualKeys = <T>(
  items: Accessor<readonly T[]>,
  getKey: (item: T, index: number) => RowKey,
  name: string,
) => {
  const data = createMemo(() => {
    const raw = items().map(getKey);
    const reserved = new Set(raw);
    const indices = new Map<RowKey, number>();
    let duplicated = false;
    const keys = raw.map((original, index) => {
      let key = original;
      if (indices.has(key)) {
        duplicated = true;
        key = `${String(original)}§${index}`;
        while (reserved.has(key) || indices.has(key)) key += '§';
      }
      indices.set(key, index);
      return key;
    });
    return { keys, indices, duplicated };
  });
  createEffect(() => {
    if (data().duplicated)
      console.warn(`${name}: duplicate record keys; provide unique keys to preserve row identity.`);
  });
  return {
    keys: (): readonly RowKey[] => data().keys,
    indexOf: (key: RowKey) => data().indices.get(key) ?? -1,
  };
};

export type VirtualKeys = ReturnType<typeof createVirtualKeys>;

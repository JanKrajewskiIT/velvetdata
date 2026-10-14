import type { RowKey } from '@jankrajewskiit/ui/common';

export interface GridWindowEntry {
  key: RowKey;
  index: number;
  top: number;
  height: number;
  rowIndex: number;
}

export const createGridHeightIndex = (keys: readonly RowKey[], sizes: number[], expanded: boolean[]) => {
  const tree = new Float64Array(keys.length + 1);
  const indices = new Map(keys.map((key, index) => [key, index]));
  let details = 0;
  const rowIndices = expanded.map((open, index) => {
    const rowIndex = index + details + 2;
    if (open) details++;
    return rowIndex;
  });
  const add = (index: number, delta: number) => {
    for (let at = index + 1; at < tree.length; at += at & -at) tree[at] = (tree[at] ?? 0) + delta;
  };
  sizes.forEach((size, index) => add(index, size));
  const prefix = (end: number): number => {
    let total = 0;
    for (let at = end; at > 0; at -= at & -at) total += tree[at] ?? 0;
    return total;
  };
  const entryAt = (index: number): GridWindowEntry => {
    const key = keys[index];
    if (key === undefined) throw new RangeError('DataGrid window index is out of range.');
    return { key, index, top: prefix(index), height: sizes[index] ?? 0, rowIndex: rowIndices[index] ?? index + 2 };
  };
  return {
    count: keys.length,
    rowCount: keys.length + details + 1,
    entryAt,
    total: () => prefix(keys.length),
    update: (key: RowKey, size: number) => {
      const index = indices.get(key);
      if (index === undefined) return;
      const previous = sizes[index] ?? 0;
      sizes[index] = size;
      add(index, size - previous);
    },
    firstVisible: (top: number) => {
      let index = 0;
      let total = 0;
      let bit = 2 ** Math.floor(Math.log2(Math.max(1, keys.length)));
      for (; bit > 0; bit = Math.floor(bit / 2)) {
        const next = index + bit;
        if (next < tree.length && total + (tree[next] ?? 0) <= top) {
          index = next;
          total += tree[next] ?? 0;
        }
      }
      return index;
    },
  };
};

import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import type { GridExpansion } from './createGridExpansion';
import type { VirtualKeys } from './createVirtualKeys';
import type { CellPosition, DataGridProps } from './dataGridTypes';
import { DEFAULT_GRID_HEIGHT, DEFAULT_GRID_OVERSCAN, ESTIMATED_GRID_ROW_HEIGHT } from './gridColumns';
import { nonnegativeInteger, positiveSize } from './virtualDimensions';

interface GridWindowOptions<T extends object> {
  config: Accessor<DataGridProps<T>>;
  keys: VirtualKeys;
  expansion: GridExpansion;
  viewport: Accessor<HTMLDivElement | undefined>;
  active: Accessor<CellPosition>;
  edit: Accessor<CellPosition | null>;
}

export interface GridWindow {
  keys: Accessor<readonly RowKey[]>;
  update: () => void;
  ensureVisible: (index: number) => void;
  measure: (key: RowKey, height: number) => void;
  gapBefore: (key: RowKey) => number;
  tail: Accessor<number>;
  rowIndex: (index: number) => number;
  rowCount: Accessor<number>;
  rowHeight: Accessor<number>;
}

/** Variable-height window: keep focused/editing rows mounted and measure expanded details with their owner. */
export const createGridWindow = <T extends object>(options: GridWindowOptions<T>): GridWindow => {
  const [scroll, setScroll] = createSignal(0);
  const [height, setHeight] = createSignal(DEFAULT_GRID_HEIGHT);
  const [header, setHeader] = createSignal(ESTIMATED_GRID_ROW_HEIGHT);
  const [measured, setMeasured] = createSignal(new Map<RowKey, { height: number; open: boolean }>());
  const rowHeight = () => positiveSize(options.config().rowHeight ?? header(), ESTIMATED_GRID_ROW_HEIGHT);
  const isOpen = (key: RowKey) => !!options.config().renderDetail && options.expansion.open().has(key);
  const update = () => {
    const element = options.viewport();
    if (!element) return;
    setScroll(element.scrollTop);
    setHeight(element.clientHeight);
    setHeader(element.querySelector<HTMLElement>('.vui-grid__row--head')?.offsetHeight ?? rowHeight());
  };
  createEffect(() => {
    const element = options.viewport();
    if (!element) return;
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
  const positions = createMemo(() => {
    let top = 0;
    let detailCount = 0;
    const entries = options.keys.keys().map((key, index) => {
      const open = isOpen(key);
      const saved = measured().get(key);
      const size = saved?.open === open ? saved.height : rowHeight() * (open ? 4 : 1);
      const entry = { key, index, top, height: size, rowIndex: index + detailCount + 2 };
      top += size;
      if (open) detailCount++;
      return entry;
    });
    return { entries, total: top, rowCount: entries.length + detailCount + 1 };
  });
  createEffect(() => {
    const keys = new Set(options.keys.keys());
    setMeasured((current) => {
      if ([...current.keys()].every((key) => keys.has(key))) return current;
      return new Map([...current].filter(([key]) => keys.has(key)));
    });
  });
  const range = createMemo(() => {
    const entryAt = (index: number) => {
      const entry = positions().entries[index];
      if (entry === undefined) throw new RangeError('DataGrid window index is out of range.');
      return entry;
    };
    if (!options.config().virtual) return positions().entries;
    const overscan = nonnegativeInteger(options.config().overscan ?? DEFAULT_GRID_OVERSCAN, DEFAULT_GRID_OVERSCAN);
    const top = Math.max(0, scroll() - header());
    const bottom = scroll() + height();
    let low = 0;
    let high = positions().entries.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const entry = entryAt(middle);
      if (entry.top + entry.height <= top) low = middle + 1;
      else high = middle;
    }
    const start = Math.max(0, low - overscan);
    let end = low;
    while (end < positions().entries.length && entryAt(end).top < bottom) end++;
    end = Math.min(positions().entries.length, end + overscan);
    const indices = new Set<number>();
    for (let index = start; index < end; index++) indices.add(index);
    for (const index of [options.active().row, options.edit()?.row]) {
      if (index !== undefined && index >= 0 && index < positions().entries.length) indices.add(index);
    }
    return [...indices].sort((a, b) => a - b).map(entryAt);
  });
  const gaps = createMemo(() => {
    let previousEnd = 0;
    const before = new Map<RowKey, number>();
    for (const entry of range()) {
      before.set(entry.key, Math.max(0, entry.top - previousEnd));
      previousEnd = entry.top + entry.height;
    }
    return { before, tail: Math.max(0, positions().total - previousEnd) };
  });
  return {
    keys: () => range().map((entry) => entry.key),
    update,
    rowHeight,
    measure: (key, size) => {
      const open = isOpen(key);
      const previous = measured().get(key);
      if (!previous && !open && size === rowHeight()) return;
      if (!Number.isFinite(size) || size <= 0 || (previous?.height === size && previous.open === open)) return;
      setMeasured((current) => new Map(current).set(key, { height: size, open }));
    },
    gapBefore: (key) => (options.config().virtual ? (gaps().before.get(key) ?? 0) : 0),
    tail: () => (options.config().virtual ? gaps().tail : 0),
    rowIndex: (index) => positions().entries[index]?.rowIndex ?? index + 2,
    rowCount: () => positions().rowCount,
    ensureVisible: (index) => {
      const element = options.viewport();
      const entry = positions().entries[index];
      if (!element || !entry) return;
      if (entry.top < element.scrollTop) element.scrollTop = entry.top;
      else if (entry.top + entry.height + header() > element.scrollTop + element.clientHeight)
        element.scrollTop =
          entry.top + Math.min(entry.height, element.clientHeight - header()) + header() - element.clientHeight;
      update();
    },
  };
};

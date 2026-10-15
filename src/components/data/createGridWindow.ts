import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import type { GridExpansion } from './createGridExpansion';
import type { VirtualKeys } from './createVirtualKeys';
import type { CellPosition, DataGridProps } from './dataGridTypes';
import { DEFAULT_GRID_HEIGHT, DEFAULT_GRID_OVERSCAN, ESTIMATED_GRID_ROW_HEIGHT } from './gridColumns';
import { createGridHeightIndex } from './gridHeightIndex';
import { nonnegativeInteger, positiveSize } from './virtualDimensions';

interface GridWindowOptions<T extends object> {
  config: Accessor<DataGridProps<T>>;
  keys: VirtualKeys;
  records: Accessor<ReadonlyMap<RowKey, T>>;
  layout: Accessor<string>;
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

export const createGridWindow = <T extends object>(options: GridWindowOptions<T>): GridWindow => {
  const [scroll, setScroll] = createSignal(0);
  const [height, setHeight] = createSignal(DEFAULT_GRID_HEIGHT);
  const [header, setHeader] = createSignal(ESTIMATED_GRID_ROW_HEIGHT);
  const [revision, setRevision] = createSignal(0);
  const rowHeight = () => positiveSize(options.config().rowHeight ?? header(), ESTIMATED_GRID_ROW_HEIGHT);
  const context = createMemo(() => ({
    layout: options.layout(),
    height: rowHeight(),
    detail: options.config().renderDetail,
    version: options.config().measurementKey,
    dataKey: options.config().dataKey,
  }));
  type Measurement = { height: number; open: boolean; row: T; context: ReturnType<typeof context> };
  const measured = new Map<RowKey, Measurement>();
  const queued = new Map<RowKey, Measurement>();
  let frame = 0;
  const isOpen = (key: RowKey) => !!options.config().renderDetail && options.expansion.open().has(key);
  const update = () => {
    const element = options.viewport();
    if (!element) return;
    setScroll(element.scrollTop);
    setHeight(element.clientHeight);
    setHeader(element.querySelector<HTMLElement>('[data-grid-header]')?.offsetHeight ?? rowHeight());
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
    const currentContext = context();
    const records = options.records();
    const keys = options.keys.keys();
    const expanded = keys.map(isOpen);
    const sizes = keys.map((key, index) => {
      const saved = measured.get(key);
      return saved &&
        saved.context === currentContext &&
        saved.row === records.get(key) &&
        saved.open === expanded[index]
        ? saved.height
        : rowHeight() * (expanded[index] ? 4 : 1);
    });
    return createGridHeightIndex(keys, sizes, expanded);
  });
  createEffect(() => {
    const keys = new Set(options.keys.keys());
    for (const key of measured.keys()) if (!keys.has(key)) measured.delete(key);
    for (const key of queued.keys()) if (!keys.has(key)) queued.delete(key);
  });
  const range = createMemo(() => {
    revision();
    const index = positions();
    if (!options.config().virtual) return Array.from({ length: index.count }, (_, at) => index.entryAt(at));
    const overscan = nonnegativeInteger(options.config().overscan ?? DEFAULT_GRID_OVERSCAN, DEFAULT_GRID_OVERSCAN);
    const first = index.firstVisible(Math.max(0, scroll() - header()));
    let end = first;
    while (end < index.count && index.entryAt(end).top < scroll() + height()) end++;
    const start = Math.max(0, first - overscan);
    end = Math.min(index.count, end + overscan);
    const indices = new Set<number>();
    for (let at = start; at < end; at++) indices.add(at);
    for (const at of [options.active().row, options.edit()?.row]) {
      if (at !== undefined && at >= 0 && at < index.count) indices.add(at);
    }
    return [...indices].sort((a, b) => a - b).map(index.entryAt);
  });
  const visibleKeys = createMemo(() => range().map((entry) => entry.key));
  const gaps = createMemo(() => {
    revision();
    let previousEnd = 0;
    const before = new Map<RowKey, number>();
    for (const entry of range()) {
      before.set(entry.key, Math.max(0, entry.top - previousEnd));
      previousEnd = entry.top + entry.height;
    }
    return { before, tail: Math.max(0, positions().total() - previousEnd) };
  });
  const flush = () => {
    frame = 0;
    const index = positions();
    for (const [key, value] of queued) {
      if (value.context !== context() || value.row !== options.records().get(key) || value.open !== isOpen(key))
        continue;
      measured.set(key, value);
      index.update(key, value.height);
    }
    queued.clear();
    setRevision((value) => value + 1);
  };
  onCleanup(() => {
    cancelAnimationFrame(frame);
    queued.clear();
    measured.clear();
  });
  return {
    keys: visibleKeys,
    update,
    rowHeight,
    measure: (key, size) => {
      if (!Number.isFinite(size) || size <= 0) return;
      const row = options.records().get(key);
      if (!row) return;
      const currentContext = context();
      const open = isOpen(key);
      const previous = queued.get(key) ?? measured.get(key);
      if (
        previous?.height === size &&
        previous.context === currentContext &&
        previous.row === row &&
        previous.open === open
      )
        return;
      if (!previous && !open && size === rowHeight()) return;
      queued.set(key, { height: size, open, row, context: currentContext });
      if (!frame) frame = requestAnimationFrame(flush);
    },
    gapBefore: (key) => (options.config().virtual ? (gaps().before.get(key) ?? 0) : 0),
    tail: () => (options.config().virtual ? gaps().tail : 0),
    rowIndex: (at) => (at >= 0 && at < positions().count ? positions().entryAt(at).rowIndex : at + 2),
    rowCount: () => positions().rowCount,
    ensureVisible: (at) => {
      const element = options.viewport();
      const index = positions();
      if (!element || at < 0 || at >= index.count) return;
      const entry = index.entryAt(at);
      if (entry.top < element.scrollTop) element.scrollTop = entry.top;
      else if (entry.top + entry.height + header() > element.scrollTop + element.clientHeight)
        element.scrollTop =
          entry.top + Math.min(entry.height, element.clientHeight - header()) + header() - element.clientHeight;
      update();
    },
  };
};

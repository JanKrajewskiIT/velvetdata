import { useI18n } from '@jankrajewskiit/i18n';
import { Text } from '@jankrajewskiit/ui/bare';
import {
  cellText,
  clamp,
  createFrameFocus,
  createRowIdentity,
  cx,
  type RowKey,
  rowValue,
} from '@jankrajewskiit/ui/common';
import { createMemo, createSignal, For, type JSX, mergeProps, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { createVirtualKeys } from './createVirtualKeys';
import { createVirtualRecord } from './createVirtualRecord';
import { DEFAULT_VIEWPORT_HEIGHT, nonnegativeInteger, positiveSize } from './virtualDimensions';
import { isRowControl } from './virtualRowTarget';
import styles from './VirtualTable.module.css';

export interface VirtualColumn<T extends object = object> {
  key: string;
  label: JSX.Element;
  /** Fixed px. */
  width?: number;
  /** Share of remaining space. @default 1 */
  flex?: number;
  align?: 'left' | 'right';
  render?: (row: T, index: number) => JSX.Element;
}

export interface VirtualTableProps<T extends object = object> {
  columns: VirtualColumn<T>[];
  rows: T[];
  /** px. @default 40 */
  rowHeight?: number;
  /** Viewport px. @default 400 */
  height?: number;
  /** @default 8 */
  overscan?: number;
  /** Stable record key used for row identity and focus; falls back to the row index. @default 'id' */
  rowKey?: string;
  getRowId?: (row: T) => RowKey;
  onRowClick?: (row: T) => void;
  class?: string;
}

const DEFAULT_ROW_HEIGHT = 40;
const DEFAULT_OVERSCAN = 8;

/** Windowed table for 10k–1M rows: only visible rows (+ overscan) are in the DOM. Fixed row height. ↑↓ PageUp/Down Home End keep the focused row in view. Footer reports the visible range. */
export const VirtualTable = <T extends object>(props: VirtualTableProps<T>): JSX.Element => {
  const p = mergeProps(
    {
      rowHeight: DEFAULT_ROW_HEIGHT,
      height: DEFAULT_VIEWPORT_HEIGHT,
      overscan: DEFAULT_OVERSCAN,
      rowKey: 'id',
    } satisfies Partial<VirtualTableProps<T>>,
    props,
  );
  const translate = useTranslate();
  const i18n = useI18n();
  const [scrollTop, setScrollTop] = createSignal(0);
  const identity = createRowIdentity<T>(
    () => p.rowKey,
    () => p.getRowId,
  );
  const keys = createVirtualKeys(
    () => p.rows,
    (row) => identity(row),
    'VirtualTable',
  );
  const [focusedKey, setFocusedKey] = createSignal<RowKey>();
  const focus = () => {
    const key = focusedKey();
    return key === undefined ? -1 : keys.indexOf(key);
  };
  const setFocus = (index: number) => setFocusedKey(keys.keys()[index]);
  const rowHeight = () => positiveSize(p.rowHeight, DEFAULT_ROW_HEIGHT);
  const height = () => positiveSize(p.height, DEFAULT_VIEWPORT_HEIGHT);
  const overscan = () => nonnegativeInteger(p.overscan, DEFAULT_OVERSCAN);
  let body!: HTMLDivElement;

  const focusFrame = createFrameFocus(() => body);
  const count = () => p.rows.length;
  const firstVisible = () => (count() ? Math.min(count() - 1, Math.floor(scrollTop() / rowHeight())) : 0);
  const start = () => Math.max(0, firstVisible() - overscan());
  const end = () => Math.min(count(), Math.ceil((scrollTop() + height()) / rowHeight()) + overscan());
  const visibleKeys = createMemo(() => {
    const first = start();
    const visible = keys.keys().slice(first, end());
    const active = focusedKey();
    if (active !== undefined && keys.indexOf(active) >= 0 && !visible.includes(active)) visible.push(active);
    return visible.sort((a, b) => keys.indexOf(a) - keys.indexOf(b));
  });
  const template = () => p.columns.map((c) => (c.width ? `${c.width}px` : `minmax(0,${c.flex ?? 1}fr)`)).join(' ');

  const goTo = (index: number) => {
    if (!count()) return;
    const target = clamp(index, 0, count() - 1);
    setFocus(target);
    const bottom = target * rowHeight() + rowHeight();
    if (bottom - rowHeight() < body.scrollTop + rowHeight()) body.scrollTop = bottom - rowHeight() * 2;
    else if (bottom > body.scrollTop + height()) body.scrollTop = bottom - height();
    focusFrame('[data-vi][tabindex="0"]');
  };

  const onKey: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (e) => {
    if (!count() || isRowControl(e.target)) return;
    const page = Math.max(1, Math.floor(height() / rowHeight()) - 1);
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page };
    const step = steps[e.key];
    const row = p.rows[focus()];
    if (step !== undefined) {
      e.preventDefault();
      goTo((focus() < 0 ? 0 : focus()) + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(count() - 1);
    } else if (e.key === 'Enter' && row) {
      p.onRowClick?.(row);
    }
  };

  const visibleRange = () =>
    `${i18n.formatNumber(count() ? firstVisible() + 1 : 0)}–${i18n.formatNumber(Math.min(count(), Math.ceil((scrollTop() + height()) / rowHeight())))}`;

  return (
    <div
      class={cx(styles.root, p.class)}
      role="table"
      aria-rowcount={count() + 1}
      style={{ '--data-table-columns': template() }}
    >
      <div role="row" class={styles.header}>
        <For each={p.columns}>
          {(c) => (
            <Text
              as="div"
              variant="label-sm"
              tone="secondary"
              role="columnheader"
              class={styles.cell}
              data-numeric={c.align === 'right' || undefined}
            >
              {c.label}
            </Text>
          )}
        </For>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- rowgroup delegates keyboard navigation to its virtualised rows */}
      <div
        ref={(element) => {
          body = element;
        }}
        class={styles.viewport}
        style={{ height: `${height()}px` }}
        role="rowgroup"
        aria-label={translate('velvetData.virtualTable.rowsCount', { count: count() })}
        tabIndex={focus() < 0 ? 0 : -1}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        onKeyDown={onKey}
        onFocusIn={(event) => {
          const row = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-vi]') : null;
          if (row) setFocus(Number(row.dataset.vi));
        }}
        onFocus={(e) => {
          if (e.target === e.currentTarget && focus() < 0) goTo(firstVisible());
        }}
      >
        <div class={styles.inner} style={{ height: `${count() * rowHeight()}px` }}>
          <For each={visibleKeys()}>
            {(key) => {
              const i = () => keys.indexOf(key);
              const record = createVirtualRecord(() => p.rows, keys, key);
              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- row keyboard handling (Enter) lives on the scroll body's onKeyDown
                <div
                  data-vi={i()}
                  data-row-key={key}
                  role="row"
                  aria-rowindex={i() + 2}
                  tabIndex={i() === focus() ? 0 : -1}
                  class={styles.row}
                  data-focused={i() === focus() || undefined}
                  data-interactive={!!p.onRowClick || undefined}
                  style={{
                    height: `${rowHeight()}px`,
                    transform: `translateY(${i() * rowHeight()}px)`,
                  }}
                  onClick={(event) => {
                    if (isRowControl(event.target)) return;
                    const row = p.rows[i()];
                    setFocus(i());
                    if (row) p.onRowClick?.(row);
                  }}
                >
                  <For each={p.columns}>
                    {(c) => (
                      <Text
                        as="div"
                        variant="body-sm"
                        tabular={c.align === 'right'}
                        role="cell"
                        class={styles.cell}
                        data-numeric={c.align === 'right' || undefined}
                      >
                        <Show when={record()} keyed>
                          {(entry) => (
                            <Show when={c.render} keyed fallback={cellText(rowValue(entry.item, c.key))}>
                              {(render) => render(entry.item, entry.index)}
                            </Show>
                          )}
                        </Show>
                      </Text>
                    )}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </div>
      <div class={styles.footer}>
        <Text as="span" variant="micro" mono tabular tone="tertiary">
          {translate('velvetData.virtualTable.rowsCount', { count: count() })}
        </Text>
        <Text as="span" variant="micro" mono tabular tone="tertiary">
          {translate('velvetData.virtualTable.rendering', {
            count: Math.max(0, end() - start()),
            range: visibleRange(),
          })}
        </Text>
      </div>
    </div>
  );
};

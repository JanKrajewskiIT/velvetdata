import { Button, EmptyText, Spinner, Text } from '@jankrajewskiit/ui/bare';
import { cx, INTERACTIVE_SELECTOR } from '@jankrajewskiit/ui/common';
import { createEffect, createMemo, createSignal, For, type JSX, mergeProps, onCleanup, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { createVirtualKeyboard } from './createVirtualKeyboard';
import { createVirtualRecord } from './createVirtualRecord';
import { createVirtualRows, DEFAULT_ITEM_HEIGHT, DEFAULT_OVERSCAN } from './createVirtualRows';
import { createVirtualScroll } from './createVirtualScroll';
import { createVirtualSelection } from './createVirtualSelection';
import { DEFAULT_VIEWPORT_HEIGHT } from './virtualDimensions';
import styles from './VirtualList.module.css';
import type { VirtualListConfig, VirtualListItemState, VirtualListProps } from './virtualListTypes';
import { isRowControl } from './virtualRowTarget';

const LOADING_ROW_HEIGHT = 44;

/**
 * Windowed list for thousands of rows — only the visible window (+ overscan) is in the DOM. Fixed `itemHeight`, or known variable
 * heights via `getItemHeight` (prefix-sum offsets, binary search). Invalid sizes fall back to safe defaults; duplicate keys warn and
 * fall back to key+index so rows never collide. Keyboard: ↑↓ PgUp PgDn Home End, Enter activates, Space/Enter selects.
 * Infinite loading: `onEndReached` fires once per growth when within `endThreshold` px of the bottom; `loading` shows a footer row.
 * For tabular data with columns use VirtualTable.
 */
export const VirtualList = <T,>(props: VirtualListProps<T>): JSX.Element => {
  const p: VirtualListConfig<T> = mergeProps(
    {
      itemHeight: DEFAULT_ITEM_HEIGHT,
      height: DEFAULT_VIEWPORT_HEIGHT,
      overscan: DEFAULT_OVERSCAN,
      gap: 0,
      selectable: false,
      endThreshold: 200,
      loading: false,
      divided: false,
    } satisfies Partial<VirtualListProps<T>>,
    props,
  );
  const translate = useTranslate();
  const label = () => p.label ?? translate('velvetData.virtualList.label');
  const loadingLabel = () => p.loadingLabel ?? translate('velvetData.virtualList.loadingLabel');
  const empty = () => p.empty ?? translate('velvetData.virtualList.empty');
  const [box, setBox] = createSignal<HTMLDivElement>();
  const scrolling = createVirtualScroll(p, box);
  const { scrollTop, onScroll } = scrolling;
  const interaction = () => p.interaction ?? (p.selectable ? 'listbox' : 'list');
  const loading = () => p.loading || scrolling.pending();
  const rows = createVirtualRows(p, scrollTop);
  const { count, height, gap, offsetAt, total, first, windowIndices } = rows;
  const { keys, isSelected, select, multiselectable } = createVirtualSelection(p);
  const { focus, setFocus, goTo, onKey } = createVirtualKeyboard(p, rows, select, box, keys);
  const renderedIndices = createMemo(() =>
    [...new Set([...windowIndices(), ...(focus() >= 0 ? [focus()] : [])])].sort((a, b) => a - b),
  );
  const visibleKeys = createMemo(() =>
    renderedIndices().flatMap((index) => {
      const key = keys.keys()[index];
      return key === undefined ? [] : [key];
    }),
  );
  let warned = false;
  createEffect(() => {
    visibleKeys();
    const element = box();
    if (!element || interaction() !== 'listbox' || warned) return;
    const frame = requestAnimationFrame(() => {
      const options = element.querySelectorAll('[role="option"]');
      if ([...options].some((option) => option.querySelector(INTERACTIVE_SELECTOR))) {
        warned = true;
        console.warn('VirtualList: interactive item content requires interaction="grid" or "list".');
      }
    });
    onCleanup(() => cancelAnimationFrame(frame));
  });

  return (
    <div class={cx(styles.root, p.class)} style={{ '--data-list-loading-height': `${LOADING_ROW_HEIGHT}px` }}>
      <div
        ref={setBox}
        class={styles.viewport}
        style={{ height: `${height()}px` }}
        role={interaction()}
        aria-label={label()}
        aria-multiselectable={interaction() === 'list' ? undefined : multiselectable()}
        aria-busy={loading() || undefined}
        aria-rowcount={interaction() === 'grid' ? count() : undefined}
        aria-colcount={interaction() === 'grid' ? 1 : undefined}
        tabIndex={focus() < 0 ? 0 : -1}
        onScroll={onScroll}
        onKeyDown={onKey}
        onFocusIn={(event) => {
          const row = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-vi]') : null;
          if (row) setFocus(Number(row.dataset.vi));
        }}
        onFocus={(e) => {
          if (e.target === e.currentTarget && count()) {
            const selected = p.items.findIndex((_item, index) => isSelected(index));
            goTo(selected >= 0 ? selected : first());
          }
        }}
      >
        <Show
          when={count() > 0 || loading() || p.error || scrolling.failed()}
          fallback={<EmptyText class={styles.empty}>{empty()}</EmptyText>}
        >
          <div class={styles.inner} style={{ height: `${total() + (loading() ? LOADING_ROW_HEIGHT : 0)}px` }}>
            <For each={visibleKeys()}>
              {(key) => {
                const i = () => keys.indexOf(key);
                const record = createVirtualRecord(() => p.items, keys, key);
                const selected = () => isSelected(i());
                const state: VirtualListItemState = {
                  get selected() {
                    return selected();
                  },
                  get focused() {
                    return i() === focus();
                  },
                };
                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- option rows are driven by the listbox owner's onKeyDown (roving tabindex)
                  <div
                    data-vi={i()}
                    role={interaction() === 'grid' ? 'row' : interaction() === 'listbox' ? 'option' : 'listitem'}
                    aria-selected={p.selectable && interaction() !== 'list' ? selected() : undefined}
                    aria-setsize={interaction() === 'grid' ? undefined : count()}
                    aria-posinset={interaction() === 'grid' ? undefined : i() + 1}
                    aria-rowindex={interaction() === 'grid' ? i() + 1 : undefined}
                    tabIndex={i() === focus() ? 0 : -1}
                    class={styles.item}
                    data-divided={p.divided || undefined}
                    data-selected={selected() || undefined}
                    data-interactive={!!(p.onSelect || p.onActivate) || undefined}
                    style={{ top: `${offsetAt(i())}px`, height: `${offsetAt(i() + 1) - offsetAt(i()) - gap()}px` }}
                    onClick={(event) => {
                      if (isRowControl(event.target)) return;
                      const index = i();
                      const item = p.items[index];
                      setFocus(index);
                      if (item === undefined) return;
                      select(index, item);
                      p.onActivate?.(item, index);
                    }}
                  >
                    <Text
                      as="div"
                      variant="body-sm"
                      class={styles.content}
                      role={interaction() === 'grid' ? 'gridcell' : 'presentation'}
                    >
                      <Show when={record()} keyed>
                        {(entry) => (
                          <Show when={p.renderItem} keyed fallback={String(entry.item)}>
                            {(render) => render(entry.item, entry.index, state) ?? String(entry.item)}
                          </Show>
                        )}
                      </Show>
                    </Text>
                  </div>
                );
              }}
            </For>
            <Show when={loading()}>
              <div class={styles.loading} style={{ top: `${total()}px` }}>
                <Spinner size="sm" label={loadingLabel()} />
                <Text as="span" variant="body-sm" tone="tertiary" aria-hidden="true">
                  {loadingLabel()}
                </Text>
              </div>
            </Show>
          </div>
        </Show>
      </div>
      <Show when={p.error || scrolling.failed()}>
        <div role="alert" class={styles.error}>
          <Text as="div" variant="body-sm" tone="danger">
            {p.error ?? translate('velvetData.virtualList.loadError')}
          </Text>
          <Button
            size="xs"
            disabled={!!p.error && !p.onRetry}
            onClick={() => {
              p.onRetry?.();
              scrolling.retry();
            }}
          >
            {translate('velvetData.dataGrid.retry')}
          </Button>
        </div>
      </Show>
    </div>
  );
};

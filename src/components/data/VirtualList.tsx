import { EmptyText } from '@jankrajewskiit/ui';
import { createMemo, For, type JSX, mergeProps, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { cx } from '../../utils/cx';
import { createVirtualKeyboard } from './createVirtualKeyboard';
import { createVirtualRecord } from './createVirtualRecord';
import { createVirtualRows, DEFAULT_ITEM_HEIGHT, DEFAULT_OVERSCAN } from './createVirtualRows';
import { createVirtualScroll } from './createVirtualScroll';
import { createVirtualSelection } from './createVirtualSelection';
import { DEFAULT_VIEWPORT_HEIGHT } from './virtualDimensions';
import type { VirtualListConfig, VirtualListItemState, VirtualListProps } from './virtualListTypes';
import { isRowControl } from './virtualRowTarget';

export type { VirtualListItemState, VirtualListProps } from './virtualListTypes';

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
  const loadingLabel = () => p.loadingLabel ?? translate('velvetData.virtualList.loadingLabel');
  const empty = () => p.empty ?? translate('velvetData.virtualList.empty');
  const { scrollTop, onScroll } = createVirtualScroll(p);
  const rows = createVirtualRows(p, scrollTop);
  const { count, height, gap, offsetAt, total, first, windowIndices } = rows;
  const { keys, isSelected, select, multiselectable } = createVirtualSelection(p);
  const visibleKeys = createMemo(() =>
    windowIndices().flatMap((index) => {
      const key = keys.keys()[index];
      return key === undefined ? [] : [key];
    }),
  );
  let box!: HTMLDivElement;
  const { focus, setFocus, goTo, onKey } = createVirtualKeyboard(p, rows, select, () => box, keys);

  return (
    <div class={cx('vui-vlist', p.divided && 'vui-vlist--divided', p.class)}>
      <div
        ref={(element) => {
          box = element;
        }}
        class="vui-vlist__scroll"
        style={{ height: `${height()}px` }}
        role={p.selectable ? 'listbox' : 'list'}
        aria-label={p.label}
        aria-multiselectable={multiselectable()}
        aria-busy={p.loading || undefined}
        tabIndex={focus() < 0 || !windowIndices().includes(focus()) ? 0 : -1}
        onScroll={onScroll}
        onKeyDown={onKey}
        onFocus={(e) => {
          if (e.target === e.currentTarget && count()) goTo(first());
        }}
      >
        <Show when={count() > 0 || p.loading} fallback={<EmptyText class="vui-vlist__empty">{empty()}</EmptyText>}>
          <div class="vui-vlist__inner" style={{ height: `${total() + (p.loading ? LOADING_ROW_HEIGHT : 0)}px` }}>
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
                    role={p.selectable ? 'option' : 'listitem'}
                    aria-selected={p.selectable ? selected() : undefined}
                    aria-setsize={count()}
                    aria-posinset={i() + 1}
                    tabIndex={i() === focus() ? 0 : -1}
                    class={cx(
                      'vui-vlist__item',
                      i() === focus() && 'vui-vlist__item--focus',
                      selected() && 'vui-vlist__item--selected',
                      (p.onSelect || p.onActivate) && 'vui-vlist__item--click',
                    )}
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
                    <Show when={record()} keyed>
                      {(entry) => (
                        <Show when={p.renderItem} keyed fallback={String(entry.item)}>
                          {(render) => render(entry.item, entry.index, state) ?? String(entry.item)}
                        </Show>
                      )}
                    </Show>
                  </div>
                );
              }}
            </For>
            <Show when={p.loading}>
              <div class="vui-vlist__loading" style={{ top: `${total()}px` }} role="status">
                <span class="vui-loader vui-loader--ring vui-loader--sm" aria-hidden="true" />
                {loadingLabel()}
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
};

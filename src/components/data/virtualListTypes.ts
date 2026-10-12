import type { JSX } from 'solid-js';

import type { RowKey } from './rowData';

export interface VirtualListItemState {
  selected: boolean;
  focused: boolean;
}

export interface VirtualListProps<T = unknown> {
  items: T[];
  renderItem?: (item: T, index: number, state: VirtualListItemState) => JSX.Element;
  /** Row height px. @default 48 */
  itemHeight?: number;
  /** Per-row height when rows differ (must be known up front). */
  getItemHeight?: (item: T, index: number) => number;
  /** Viewport height px. @default 400 */
  height?: number;
  /** Rows rendered outside the viewport. @default 6 */
  overscan?: number;
  /** Space between rows px. @default 0 */
  gap?: number;
  /** Stable key. @default item.id ?? item.key ?? index */
  getKey?: (item: T, index: number) => RowKey;
  /** listbox semantics + selected styling. */
  selectable?: boolean;
  /** Selected key, or keys (multi). */
  selected?: RowKey | RowKey[];
  onSelect?: (key: RowKey, item: T) => void;
  /** Click / Enter. */
  onActivate?: (item: T, index: number) => void;
  onEndReached?: () => void;
  /** @default 200 */
  endThreshold?: number;
  loading?: boolean;
  /** @default localized "Loading more…" */
  loadingLabel?: string;
  /** @default localized "Nothing to show" */
  empty?: JSX.Element;
  /** Accessible name. */
  label?: string;
  /** Hairline between rows. */
  divided?: boolean;
  class?: string;
}

export type VirtualListConfig<T> = VirtualListProps<T> &
  Required<
    Pick<
      VirtualListProps<T>,
      'itemHeight' | 'height' | 'overscan' | 'gap' | 'selectable' | 'endThreshold' | 'loading' | 'divided'
    >
  >;

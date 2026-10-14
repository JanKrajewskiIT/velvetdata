import type { RowKey } from '@jankrajewskiit/ui/common';
import type { JSX } from 'solid-js';

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
  interaction?: 'list' | 'listbox' | 'grid';
  selectionMode?: 'single' | 'multiple';
  defaultSelected?: RowKey | RowKey[];
  onSelectionChange?: (selected: RowKey | RowKey[]) => void;
  textValue?: (item: T) => string;
  dataKey?: string | number;
  /** Selected key, or keys (multi). */
  selected?: RowKey | RowKey[];
  onSelect?: (key: RowKey, item: T) => void;
  /** Click / Enter. */
  onActivate?: (item: T, index: number) => void;
  onEndReached?: (signal: AbortSignal) => unknown;
  hasMore?: boolean;
  error?: JSX.Element;
  onLoadError?: (error: unknown) => void;
  onRetry?: () => void;
  /** @default 200 */
  endThreshold?: number;
  loading?: boolean;
  /** @default localized "Loading more…" */
  loadingLabel?: string;
  /** @default localized "Nothing to show" */
  empty?: JSX.Element;
  /** Accessible name. @default localized "Record list" */
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

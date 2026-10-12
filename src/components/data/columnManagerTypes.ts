import type { JSX } from 'solid-js';

export type ColumnPin = 'left' | 'right';

export interface ManagedColumn {
  key: string;
  label: JSX.Element;
  /** Start hidden when false. @default true */
  visible?: boolean;
  /** Start pinned. */
  pin?: ColumnPin;
  /** Can't be hidden, moved or unpinned (e.g. Name). */
  locked?: boolean;
  canHide?: boolean;
  canPin?: boolean;
  canMove?: boolean;
  /** Reference aliases; canHide/canPin/canMove take precedence. */
  hideable?: boolean;
  pinnable?: boolean;
  movable?: boolean;
}

export interface ColumnState {
  key: string;
  visible: boolean;
  pin: ColumnPin | null;
}

export interface ColumnManagerProps {
  /** Source columns in their default order. */
  columns: ManagedColumn[];
  value?: ColumnState[];
  defaultValue?: ColumnState[];
  /** What Reset restores; defaults to the column definitions. */
  resetValue?: ColumnState[];
  onChange?: (state: ColumnState[]) => void;
  /** Preferred name — same callback as onChange (onChange stays as an alias). */
  onValueChange?: (state: ColumnState[]) => void;
  /** @default localized "Columns" */
  title?: string;
  /** Offer a "Pinned right" section (actions, totals). @default false */
  pinRight?: boolean;
  /** Cap on pinned columns — pins beyond it are disabled with a hint. */
  maxPinned?: number;
  /** Minimum number of visible columns. @default 0 */
  minVisible?: number;
  /** Defaults to on when there are more than 8 columns. */
  searchable?: boolean;
  class?: string;
}

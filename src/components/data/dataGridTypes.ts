import type { RowKey } from '@jankrajewskiit/ui/common';
import type { JSX } from 'solid-js';

import type { QueryField } from '../patterns/queryModel';
import type { ColumnPin } from './columnManagerTypes';
import type { GridViewState } from './gridViewTypes';

export interface GridColumn<T extends object = object> {
  key: string;
  label: JSX.Element;
  /** px, resizable by dragging the header edge. @default 160 */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** @default true */
  sortable?: boolean;
  sortAccessor?: (row: T) => unknown;
  /** Ascending comparison; descending order reverses its result. */
  sortFn?: (a: T, b: T) => number;
  /** Value used by text search and query rules for this column. */
  filterAccessor?: (row: T) => unknown;
  /** Custom free-text search predicate. */
  filterFn?: (row: T, search: string) => boolean;
  /** number = right-aligned, tabular, parsed on edit. */
  type?: 'text' | 'number';
  editable?: boolean;
  /** Edit with a select. */
  options?: string[];
  format?: (value: unknown) => JSX.Element;
  render?: (row: T) => JSX.Element;
  /** Start pinned (frozen). */
  pin?: ColumnPin;
  /** Start hidden (re-enable in Columns). */
  hidden?: boolean;
  /** Can't be hidden / moved / unpinned in Columns. */
  locked?: boolean;
  canHide?: boolean;
  canPin?: boolean;
  canMove?: boolean;
  /** Reference aliases; canHide/canPin/canMove take precedence. */
  hideable?: boolean;
  pinnable?: boolean;
  movable?: boolean;
}

export interface GridRowChange {
  row: RowKey;
  key: string;
  value: unknown;
}

export interface DataGridProps<T extends object = object> {
  columns: GridColumn<T>[];
  rows: T[];
  /** @default 'id' */
  rowKey?: string;
  /** Stable unique identity, required when records have no key field and are replaced or reordered. */
  getRowId?: (row: T) => RowKey;
  /** Controlled search, query, sorting, column order, pins, visibility and widths. */
  view?: GridViewState;
  defaultView?: Partial<GridViewState>;
  onViewChange?: (view: GridViewState) => void;
  /** Keep filtering and sorting in the consumer's server query. */
  manualFiltering?: boolean;
  manualSorting?: boolean;
  /** Total record count when rows contains one server page. */
  rowCount?: number;
  /** Optional localStorage key. Only view settings are stored, never records. */
  persistenceKey?: string;
  onViewError?: (error: Error) => void;
  /** Reset and validated JSON import/export controls. */
  viewSettings?: boolean;
  /** Render only the visible row window; expanded details are measured. */
  virtual?: boolean;
  /** Override the design-system row height in px; otherwise measure it (initial estimate: 36). */
  rowHeight?: number;
  /** Additional rows above and below the viewport. @default 6 */
  overscan?: number;
  /** Accessible grid name. */
  label?: string;
  onRowsChange?: (rows: T[], change: GridRowChange) => void;
  /** Scroll area height in px. @default 360 */
  height?: number;
  /** Pin the first column when no column sets pin. @default true */
  stickyFirst?: boolean;
  /** @default true */
  rowNumbers?: boolean;
  selectable?: boolean;
  /** Selected row keys (controlled). */
  selected?: RowKey[];
  onSelectionChange?: (keys: RowKey[]) => void;
  /** Buttons shown in the toolbar while rows are selected. */
  bulkActions?: (rows: T[]) => JSX.Element;
  /** Expandable detail panel under a row. */
  renderDetail?: (row: T) => JSX.Element;
  /** Free-text filter across visible columns. */
  searchable?: boolean;
  /** @default localized "Filter N records…" */
  searchPlaceholder?: string;
  /** Enables the Filters popover (QueryBuilder). */
  filterFields?: QueryField[];
  /** Enables the Columns popover (ColumnManager). */
  columnManager?: boolean;
  /** Shows Export. Pass null for a built-in CSV download of the current view. */
  onExport?: ((rows: T[], columns: GridColumn<T>[]) => void) | null;
  /** Extra toolbar nodes on the right. */
  toolbarEnd?: JSX.Element;
  /** true = "Showing X of Y"; a node adds it on the right. */
  footer?: JSX.Element;
  class?: string;
}

export type CellPosition = { row: number; col: number };
export type EditMove = 'down' | 'right' | 'left' | 'stay';

import type { QueryGroup } from '../patterns/queryModel';
import type { ColumnState } from './columnManagerTypes';
import type { RowSort } from './rowData';

/** Serializable view settings; records and selected rows are owned separately. */
export interface GridViewState {
  search: string;
  query?: QueryGroup;
  sort: RowSort | null;
  columns: ColumnState[];
  widths: Record<string, number>;
}

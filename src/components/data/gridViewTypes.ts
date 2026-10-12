import type { RowSort } from '@jankrajewskiit/ui/common';

import type { QueryGroup } from '../patterns/queryModel';
import type { ColumnState } from './columnManagerTypes';

/** Serializable view settings; records and selected rows are owned separately. */
export interface GridViewState {
  search: string;
  query?: QueryGroup;
  sort: RowSort | null;
  columns: ColumnState[];
  widths: Record<string, number>;
}

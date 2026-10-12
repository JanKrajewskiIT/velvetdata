import type { ColumnManagerProps, ColumnState } from './columnManagerTypes';
import type { ColumnDrag } from './createColumnDrag';
import type { ColumnModel } from './createColumnModel';
import type { ColumnSearch } from './createColumnSearch';

export interface ColumnManagerController {
  config: ColumnManagerProps & { pinRight: boolean };
  model: ColumnModel;
  drag: ColumnDrag;
  search: ColumnSearch;
  keyMove: (e: KeyboardEvent, c: ColumnState) => void;
}

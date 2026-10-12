import type { DataGridProps, GridColumn } from './dataGridTypes';
import { downloadCsv, toCsv } from './exportCsv';
import { columnName } from './gridColumns';

const EXPORT_FILE_NAME = 'export.csv';

export const exportGridRows = <T extends object>(
  rows: T[],
  columns: GridColumn<T>[],
  onExport: DataGridProps<T>['onExport'],
): void => {
  if (onExport) {
    onExport(rows, columns);
    return;
  }
  downloadCsv(
    toCsv(
      rows,
      columns.map((c) => ({ key: c.key, header: columnName(c) })),
    ),
    EXPORT_FILE_NAME,
  );
};

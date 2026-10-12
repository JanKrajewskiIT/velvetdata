import { cellText, rowValue } from '@jankrajewskiit/ui/common';

const quote = (value: string): string => `"${value.replace(/"/gu, '""')}"`;

export interface CsvColumn {
  key: string;
  header: string;
}

/** Quoted CSV text: one header line, then one line per row. */
export const toCsv = (rows: object[], columns: CsvColumn[]): string =>
  [
    columns.map((c) => quote(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => quote(cellText(rowValue(r, c.key)))).join(',')),
  ].join('\n');

/** Triggers a browser download of `text` as `fileName`. */
export const downloadCsv = (text: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

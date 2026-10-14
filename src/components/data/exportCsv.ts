import { cellText, rowValue } from '@jankrajewskiit/ui/common';

const FORMULA_PREFIX = /^(?:\s*[=+\-@＝＋－＠]|[\t\r\n])/u;

const spreadsheetText = (value: string): string => (FORMULA_PREFIX.test(value) ? `'${value}` : value);
const quote = (value: string): string => `"${value.replace(/"/gu, '""')}"`;
const csvValue = (value: unknown): string => {
  if (typeof value === 'string') return spreadsheetText(value);
  return typeof value === 'boolean' ? String(value) : cellText(value);
};

export interface CsvColumn {
  key: string;
  header: string;
}

/** Spreadsheet-safe CSV: formula-like text is prefixed with an apostrophe; numeric values stay numeric. */
export const toCsv = (rows: object[], columns: CsvColumn[]): string =>
  [
    columns.map((c) => quote(spreadsheetText(c.header))).join(','),
    ...rows.map((r) => columns.map((c) => quote(csvValue(rowValue(r, c.key)))).join(',')),
  ].join('\n');

/** Triggers a browser download of `text` as `fileName`. */
export const downloadCsv = (text: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
};

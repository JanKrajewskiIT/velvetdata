import type { RowKey } from '@jankrajewskiit/ui/common';
import type { JSX } from 'solid-js';

export type EditMove = 'down' | 'right' | 'left' | 'stay';

export interface GridEditorContext<T extends object> {
  readonly row: T;
  readonly columnKey: string;
  readonly draft: string;
  readonly pending: boolean;
  readonly error: string | undefined;
  readonly errorId: string;
  readonly setDraft: (value: string) => void;
  readonly commit: (move?: EditMove) => void;
  readonly cancel: () => void;
}

export type GridEditor<T extends object> = (context: GridEditorContext<T>) => JSX.Element;

export interface GridBulkSelection<T extends object> {
  readonly keys: readonly RowKey[];
  readonly loadedRows: readonly T[];
}

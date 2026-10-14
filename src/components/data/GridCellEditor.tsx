import { createUniqueId, Show } from 'solid-js';

import type { DataGridController } from './dataGridController';
import type { GridColumn } from './dataGridTypes';
import type { GridEditorContext } from './gridEditorTypes';
import { GridNativeEditor } from './GridNativeEditor';

export interface GridCellEditorProps<T extends object> {
  grid: DataGridController<T>;
  column: GridColumn<T>;
  row: T;
  rowIndex: number;
  colIndex: number;
}

export const GridCellEditor = <T extends object>(props: GridCellEditorProps<T>) => {
  const errorId = createUniqueId();
  const context: GridEditorContext<T> = {
    get row() {
      return props.row;
    },
    get columnKey() {
      return props.column.key;
    },
    get draft() {
      return props.grid.active.draft();
    },
    get pending() {
      return props.grid.active.pending();
    },
    get error() {
      return props.grid.active.error();
    },
    errorId,
    setDraft: (value) => props.grid.active.setDraft(value),
    commit: (move) => props.grid.active.commit(move),
    cancel: () => props.grid.active.cancelEdit(props.rowIndex, props.colIndex),
  };
  return (
    <div class="vui-grid__editor" aria-busy={props.grid.active.pending() || undefined}>
      <Show
        when={props.column.editor}
        keyed
        fallback={
          <GridNativeEditor
            context={context}
            options={props.column.options}
            numeric={props.column.type === 'number'}
            label={typeof props.column.label === 'string' ? props.column.label : props.column.key}
            onBlur={() => props.grid.active.commitOnBlur()}
          />
        }
      >
        {(render) => render(context)}
      </Show>
      <Show when={props.grid.active.error()}>
        {(message) => (
          <span id={errorId} role="alert" class="vui-grid__edit-error">
            {message()}
          </span>
        )}
      </Show>
    </div>
  );
};

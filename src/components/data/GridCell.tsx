import { IconButton, Text } from '@jankrajewskiit/ui/bare';
import { cellText, type RowKey, rowValue } from '@jankrajewskiit/ui/common';
import { type JSX, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import type { GridColumn } from './dataGridTypes';
import styles from './GridCell.module.css';
import { GridCellEditor } from './GridCellEditor';

export interface GridCellProps<T extends object> {
  grid: DataGridController<T>;
  column: GridColumn<T>;
  row: T;
  rowKey: RowKey;
  rowIndex: number;
  colIndex: number;
  /** Whether the row's detail panel is open. */
  open: boolean;
}

const renderCell = <T extends object>(c: GridColumn<T>, row: T): JSX.Element => {
  const value = rowValue(row, c.key);
  return c.format ? c.format(value) : cellText(value);
};

/** One gridcell: the roving-tabindex stop with the detail expander, the rendered value or the editor. */
export const GridCell = <T extends object>(props: GridCellProps<T>) => {
  const translate = useTranslate();
  const active = () =>
    props.grid.active.cell().row === props.rowIndex && props.grid.active.cell().col === props.colIndex;
  const editing = () =>
    props.grid.active.edit()?.row === props.rowIndex && props.grid.active.edit()?.col === props.colIndex;
  const editable = () => props.grid.active.canEdit(props.colIndex);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- gridcell keyboard handling lives on the grid owner (onKeyDown)
    <div
      role="gridcell"
      data-rc={`${props.rowIndex}-${props.colIndex}`}
      tabIndex={active() && !editing() ? 0 : -1}
      aria-readonly={!editable() || undefined}
      class={styles.root}
      data-active={active() || undefined}
      data-editing={editing() || undefined}
      data-numeric={props.column.type === 'number' || undefined}
      data-pin={props.column.pin}
      data-pin-edge={props.grid.layout.pinEdge(props.column)}
      style={props.grid.layout.pinStyle(props.column)}
      onClick={() => props.grid.active.setCell({ row: props.rowIndex, col: props.colIndex })}
      onFocus={() => props.grid.active.setCell({ row: props.rowIndex, col: props.colIndex })}
      onDblClick={() => props.grid.active.startEdit(props.rowIndex, props.colIndex)}
    >
      <Show when={props.colIndex === 0 && props.grid.config.renderDetail && !editing()}>
        <IconButton
          size="xs"
          icon="chevron-right"
          tabIndex={-1}
          class={styles.expander}
          label={translate(props.open ? 'velvetData.dataGrid.collapseRow' : 'velvetData.dataGrid.expandRow')}
          aria-expanded={props.open}
          onClick={(e) => {
            e.stopPropagation();
            props.grid.expansion.toggleOpen(props.rowKey);
          }}
        />
      </Show>
      <Show
        when={editing()}
        fallback={
          <Show
            when={props.column.render}
            keyed
            fallback={
              <Text as="div" variant="body-sm" tabular={props.column.type === 'number'} class={styles.value}>
                {renderCell(props.column, props.row)}
              </Text>
            }
          >
            {(render) => (
              <Text
                as="div"
                variant="body-sm"
                tabular={props.column.type === 'number'}
                class={styles.customValue}
                data-numeric={props.column.type === 'number' || undefined}
              >
                {render(props.row)}
              </Text>
            )}
          </Show>
        }
      >
        <GridCellEditor
          grid={props.grid}
          column={props.column}
          row={props.row}
          rowIndex={props.rowIndex}
          colIndex={props.colIndex}
        />
      </Show>
    </div>
  );
};

import { Checkbox, classNames, useI18n } from '@jankrajewskiit/ui';
import type { JSX } from 'solid-js';
import { type Accessor, For, Show } from 'solid-js';

import type { DataGridProColumn } from '../DataGridPro.types';
import styles from './DataGridProBody.module.css';

interface VisibleRow<T extends Record<string, unknown>> {
  row: T;
  index: number;
  id: string;
}

interface DataGridProBodyProps<T extends Record<string, unknown>> {
  hasRows: Accessor<boolean>;
  bodyHeight: Accessor<number>;
  totalRowsHeight: Accessor<number>;
  offsetY: Accessor<number>;
  visibleRows: Accessor<readonly VisibleRow<T>[]>;
  striped: Accessor<boolean>;
  rowHeight: Accessor<number>;
  selectable: Accessor<boolean>;
  selectedSet: Accessor<Set<string>>;
  onToggleRow: (id: string) => void;
  visibleColumns: Accessor<readonly DataGridProColumn<T>[]>;
  getColumnPin: (column: DataGridProColumn<T>) => 'left' | 'right' | null;
  getColumnStyle: (column: DataGridProColumn<T>) => JSX.CSSProperties;
}

const DataGridProBody = <T extends Record<string, unknown>>(props: DataGridProBodyProps<T>) => {
  const { ts } = useI18n();

  const emptyStyle = () => ({ '--body-height': `${String(props.bodyHeight())}px` });
  const bodyStyle = () => ({ '--total-rows-height': `${String(props.totalRowsHeight())}px` });
  const rowsStyle = () => ({ '--offset-y': `${String(props.offsetY())}px` });
  const rowStyle = () => ({ '--row-height': `${String(props.rowHeight())}px` });

  const handleCheckboxClick = (event: MouseEvent & { currentTarget: HTMLInputElement }) => {
    event.stopPropagation();
  };

  return (
    <Show
      when={props.hasRows()}
      fallback={
        <div class={styles.empty} role="status" style={emptyStyle()}>
          {ts('dataGrid.noRows')}
        </div>
      }
    >
      <div class={styles.body} role="rowgroup" style={bodyStyle()}>
        <div class={styles.rows} style={rowsStyle()}>
          <For each={props.visibleRows()}>
            {(entry) => (
              <div
                role="row"
                aria-rowindex={entry.index + 2}
                aria-selected={props.selectable() ? props.selectedSet().has(entry.id) : undefined}
                class={classNames(
                  styles.row,
                  props.striped() && entry.index % 2 === 1 && styles.striped,
                  props.selectedSet().has(entry.id) && styles.rowSelected,
                )}
                style={rowStyle()}
              >
                <Show when={props.selectable()}>
                  <div role="gridcell" class={classNames(styles.cell, styles.pinnedLeft, styles.selectionCell)}>
                    <Checkbox
                      class={styles.selectionCheckbox}
                      checked={props.selectedSet().has(entry.id)}
                      onClick={handleCheckboxClick}
                      onChange={() => props.onToggleRow(entry.id)}
                      aria-label={ts('dataGrid.selectRow', { id: entry.id })}
                    />
                  </div>
                </Show>
                <For each={props.visibleColumns()}>
                  {(column) => (
                    <div
                      role="gridcell"
                      class={classNames(
                        styles.cell,
                        props.getColumnPin(column) === 'left' && styles.pinnedLeft,
                        props.getColumnPin(column) === 'right' && styles.pinnedRight,
                      )}
                      style={props.getColumnStyle(column)}
                    >
                      {column.render
                        ? column.render(entry.row[column.key], entry.row)
                        : (() => {
                            const val = entry.row[column.key];
                            return val == null ? '' : typeof val === 'string' ? val : String(val);
                          })()}
                    </div>
                  )}
                </For>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default DataGridProBody;

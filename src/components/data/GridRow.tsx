import { Text } from '@jankrajewskiit/ui/bare';
import { createMemo, For, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import { GridCell } from './GridCell';
import styles from './GridRow.module.css';
import { GridRowNumber } from './GridRowNumber';
import { GridSelectionCell } from './GridSelectionCell';

export interface GridRowProps<T extends object> {
  grid: DataGridController<T>;
  row: T;
  /** Zero-based position in the current view. */
  index: number;
}

/** One data row (number, checkbox, cells) plus its detail row while expanded. */
export const GridRow = <T extends object>(props: GridRowProps<T>) => {
  const translate = useTranslate();
  const key = () => props.grid.keyOf(props.row, props.index);
  const isSelected = () => props.grid.selection.selectedSet().has(key());
  const isOpen = () => !!props.grid.config.renderDetail && props.grid.expansion.open().has(key());
  const retainFocus = () => props.grid.active.setCell({ row: props.index, col: props.grid.active.cell().col });
  return (
    <>
      <div
        role="row"
        onFocus={retainFocus}
        aria-rowindex={props.grid.window.rowIndex(props.index)}
        aria-selected={props.grid.config.selectable ? isSelected() : undefined}
        aria-expanded={props.grid.config.renderDetail ? isOpen() : undefined}
        class={styles.row}
        data-current={props.grid.active.cell().row === props.index || undefined}
      >
        <Show when={props.grid.config.rowNumbers}>
          <GridRowNumber index={props.index} />
        </Show>
        <Show when={props.grid.config.selectable}>
          <GridSelectionCell
            style={props.grid.layout.checkLeft()}
            label={translate('velvetData.dataGrid.selectRow', { row: props.index + 1 })}
            checked={isSelected()}
            onChange={() => props.grid.selection.toggleRow(key())}
          />
        </Show>
        <For each={props.grid.view.cols().map((column) => column.key)}>
          {(columnKey, ci) => {
            const column = createMemo(() => props.grid.view.columnsByKey().get(columnKey));
            return (
              <Show when={column()}>
                {(current) => (
                  <GridCell
                    grid={props.grid}
                    column={current()}
                    row={props.row}
                    rowKey={key()}
                    rowIndex={props.index}
                    colIndex={ci()}
                    open={isOpen()}
                  />
                )}
              </Show>
            );
          }}
        </For>
      </div>
      <Show when={isOpen()}>
        <div
          role="row"
          onFocus={retainFocus}
          aria-rowindex={props.grid.window.rowIndex(props.index) + 1}
          class={styles.detailRow}
        >
          <div
            role="gridcell"
            aria-colspan={props.grid.view.cols().length + (props.grid.config.selectable ? 1 : 0)}
            class={styles.detail}
          >
            <Text as="div" variant="body-sm" class={styles.detailContent}>
              {props.grid.config.renderDetail?.(props.row)}
            </Text>
          </div>
        </div>
      </Show>
    </>
  );
};

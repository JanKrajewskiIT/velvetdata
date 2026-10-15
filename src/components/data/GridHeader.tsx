import { For, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import styles from './GridHeader.module.css';
import { GridHeaderCell } from './GridHeaderCell';
import { GridRowNumber } from './GridRowNumber';
import { GridSelectionCell } from './GridSelectionCell';

export interface GridHeaderProps<T extends object> {
  grid: DataGridController<T>;
}

export const GridHeader = <T extends object>(props: GridHeaderProps<T>) => {
  const translate = useTranslate();
  return (
    <div role="row" aria-rowindex={1} data-grid-header class={styles.root}>
      <Show when={props.grid.config.rowNumbers}>
        <GridRowNumber />
      </Show>
      <Show when={props.grid.config.selectable}>
        <GridSelectionCell
          header
          style={props.grid.layout.checkLeft()}
          label={translate('velvetData.dataGrid.selectAllRows')}
          checked={props.grid.selection.allOn()}
          indeterminate={props.grid.selection.someOn()}
          onChange={props.grid.selection.toggleAll}
        />
      </Show>
      <For each={props.grid.view.cols().map((column) => column.key)}>
        {(key) => <GridHeaderCell grid={props.grid} columnKey={key} />}
      </For>
    </div>
  );
};

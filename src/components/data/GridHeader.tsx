import { Checkbox } from '@jankrajewskiit/ui/bare';
import { For, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import { GridHeaderCell } from './GridHeaderCell';

export interface GridHeaderProps<T extends object> {
  grid: DataGridController<T>;
}

export const GridHeader = <T extends object>(props: GridHeaderProps<T>) => {
  const translate = useTranslate();
  return (
    <div role="row" aria-rowindex={1} class="vui-grid__row vui-grid__row--head">
      <Show when={props.grid.config.rowNumbers}>
        <div class="vui-grid__rn" aria-hidden="true">
          #
        </div>
      </Show>
      <Show when={props.grid.config.selectable}>
        <div role="columnheader" class="vui-grid__chk" style={props.grid.layout.checkLeft()}>
          <Checkbox
            aria-label={translate('velvetData.dataGrid.selectAllRows')}
            checked={props.grid.selection.allOn()}
            indeterminate={props.grid.selection.someOn()}
            onChange={props.grid.selection.toggleAll}
          />
        </div>
      </Show>
      <For each={props.grid.view.cols().map((column) => column.key)}>
        {(key) => <GridHeaderCell grid={props.grid} columnKey={key} />}
      </For>
    </div>
  );
};

import { Show } from 'solid-js';

import { useTranslateRich } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import { GridSelectedCount } from './GridSelectedCount';

export interface GridFooterProps<T extends object> {
  grid: DataGridController<T>;
}

/** "Showing X of Y" line, the selected count while rows are selected, and the consumer's `footer` node. */
export const GridFooter = <T extends object>(props: GridFooterProps<T>) => {
  const translateRich = useTranslateRich();
  return (
    <Show when={props.grid.config.footer}>
      <div class="vui-dgrid__foot">
        <span aria-live="polite">
          {translateRich('velvetData.dataGrid.showing', {
            shown: props.grid.view.rows().length,
            total: props.grid.config.rowCount ?? props.grid.config.rows.length,
            b: (children) => <b>{children}</b>,
          })}
        </span>
        <Show when={props.grid.config.selectable && props.grid.selection.selectedRows().length > 0}>
          <span>
            <GridSelectedCount count={props.grid.selection.selectedRows().length} />
          </span>
        </Show>
        <Show when={typeof props.grid.config.footer !== 'boolean'}>
          <span class="vui-dgrid__foot-end">{props.grid.config.footer}</span>
        </Show>
      </div>
    </Show>
  );
};

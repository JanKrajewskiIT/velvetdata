import { ColumnResize, Glyph } from '@jankrajewskiit/ui';
import { createMemo, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { cx } from '../../utils/cx';
import type { DataGridController } from './dataGridController';
import { columnName } from './gridColumns';
import { nextSort } from './rowData';

export interface GridHeaderCellProps<T extends object> {
  grid: DataGridController<T>;
  columnKey: string;
}

export const GridHeaderCell = <T extends object>(props: GridHeaderCellProps<T>) => {
  const translate = useTranslate();
  const column = createMemo(() => props.grid.view.cols().find((candidate) => candidate.key === props.columnKey));
  const sorted = () => props.grid.view.sort()?.key === props.columnKey;
  return (
    <Show when={column()}>
      {(current) => (
        <div
          role="columnheader"
          aria-sort={sorted() ? (props.grid.view.sort()?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
          class={cx(
            'vui-grid__hd',
            current().type === 'number' && 'vui-grid__num',
            props.grid.layout.pinClass(current()),
          )}
          style={props.grid.layout.pinStyle(current())}
        >
          <button
            type="button"
            disabled={current().sortable === false}
            class="vui-grid__hbtn"
            onClick={() =>
              current().sortable !== false && props.grid.view.setSort(nextSort(props.grid.view.sort(), props.columnKey))
            }
          >
            {current().label}
            <Show when={current().sortable !== false}>
              <Show
                when={sorted()}
                fallback={<Glyph name="chevrons-up-down" class="vui-grid__sort vui-grid__sort--idle" />}
              >
                <Glyph
                  name={props.grid.view.sort()?.dir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  class="vui-grid__sort"
                />
              </Show>
            </Show>
            <Show when={current().editable}>
              <Glyph name="pencil" class="vui-grid__edit-ic" />
            </Show>
          </button>
          <ColumnResize
            label={translate('velvetData.dataGrid.resizeColumn', { name: columnName(current()) })}
            width={props.grid.layout.widths()[props.columnKey]}
            min={current().minWidth}
            max={current().maxWidth}
            onResize={(width) => props.grid.layout.setWidth(props.columnKey, width)}
            onReset={() => props.grid.view.resetWidth(props.columnKey)}
          />
        </div>
      )}
    </Show>
  );
};

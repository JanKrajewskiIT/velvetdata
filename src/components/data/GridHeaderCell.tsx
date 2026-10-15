import { ColumnResize, Glyph, Text } from '@jankrajewskiit/ui/bare';
import { columnName, nextSort } from '@jankrajewskiit/ui/common';
import { createMemo, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import styles from './GridHeaderCell.module.css';

export interface GridHeaderCellProps<T extends object> {
  grid: DataGridController<T>;
  columnKey: string;
}

export const GridHeaderCell = <T extends object>(props: GridHeaderCellProps<T>) => {
  const translate = useTranslate();
  const column = createMemo(() => props.grid.view.columnsByKey().get(props.columnKey));
  const sorted = () => props.grid.view.sort()?.key === props.columnKey;
  return (
    <Show when={column()}>
      {(current) => (
        <div
          role="columnheader"
          aria-sort={sorted() ? (props.grid.view.sort()?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
          class={styles.root}
          data-pin={current().pin}
          data-pin-edge={props.grid.layout.pinEdge(current())}
          style={props.grid.layout.pinStyle(current())}
        >
          <button
            type="button"
            disabled={current().sortable === false}
            class={styles.button}
            data-numeric={current().type === 'number' || undefined}
            onClick={() =>
              current().sortable !== false && props.grid.view.setSort(nextSort(props.grid.view.sort(), props.columnKey))
            }
          >
            <Text as="span" variant="label-sm" class={styles.label}>
              {current().label}
            </Text>
            <Show when={current().sortable !== false}>
              <Show
                when={sorted()}
                fallback={<Glyph name="chevrons-up-down" size="xs" class={styles.sort} data-idle />}
              >
                <Glyph
                  name={props.grid.view.sort()?.dir === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size="xs"
                  class={styles.sort}
                />
              </Show>
            </Show>
            <Show when={current().editable}>
              <Glyph name="pencil" size="xs" class={styles.editIcon} />
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

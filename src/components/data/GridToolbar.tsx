import { Button, Count, Popover, SearchInput } from '@jankrajewskiit/ui/bare';
import { Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { QueryBuilder } from '../patterns/QueryBuilder';
import { ColumnManager } from './ColumnManager';
import type { DataGridController } from './dataGridController';
import { initialColumnState } from './gridColumns';
import { exportGridRows } from './gridExport';
import { GridSelectedCount } from './GridSelectedCount';
import { GridViewSettings } from './GridViewSettings';

export interface GridToolbarProps<T extends object> {
  grid: DataGridController<T>;
}

/** Search or bulk bar on the left; Filters, Columns, Export and `toolbarEnd` on the right. Renders nothing when no tool is enabled. */
export const GridToolbar = <T extends object>(props: GridToolbarProps<T>) => {
  const translate = useTranslate();
  const managedColumns = () => {
    const columns = props.grid.config.columns;
    const defaults = initialColumnState(columns, props.grid.config.stickyFirst ?? true);
    return columns.map((column, index) => ({
      key: column.key,
      label: column.label,
      visible: !column.hidden,
      pin: defaults[index]?.pin ?? undefined,
      locked: column.locked,
      canHide: column.canHide,
      canPin: column.canPin,
      canMove: column.canMove,
      hideable: column.hideable,
      pinnable: column.pinnable,
      movable: column.movable,
    }));
  };
  const hasToolbar = () =>
    props.grid.config.searchable ||
    !!props.grid.config.filterFields ||
    props.grid.config.columnManager ||
    props.grid.config.viewSettings ||
    !props.grid.view.isDefault() ||
    props.grid.config.onExport !== undefined ||
    !!props.grid.config.toolbarEnd ||
    (props.grid.config.selectable && (!!props.grid.config.bulkActions || !!props.grid.config.bulkSelectionActions));

  return (
    <Show when={hasToolbar()}>
      <div class="vui-dgrid__bar">
        <Show
          when={props.grid.config.selectable && props.grid.selection.selectedKeys().length > 0}
          fallback={
            <Show when={props.grid.config.searchable}>
              <SearchInput
                size="sm"
                class="vui-dgrid__search"
                aria-label={translate('velvetData.dataGrid.searchLabel')}
                placeholder={
                  props.grid.config.searchPlaceholder ??
                  translate('velvetData.dataGrid.searchPlaceholder', { count: props.grid.config.rows.length })
                }
                value={props.grid.view.search()}
                onValueChange={props.grid.view.setSearch}
              />
            </Show>
          }
        >
          <div class="vui-dgrid__bulk">
            <span class="vui-dgrid__bulk-n">
              <GridSelectedCount count={props.grid.selection.selectedKeys().length} />
            </span>
            <Button size="sm" variant="ghost" onClick={props.grid.selection.clear}>
              {translate('velvet.common.clear')}
            </Button>
            {props.grid.config.bulkActions?.(props.grid.selection.selectedRows())}
            {props.grid.config.bulkSelectionActions?.({
              keys: props.grid.selection.selectedKeys(),
              loadedRows: props.grid.selection.selectedRows(),
            })}
          </div>
        </Show>
        <div class="vui-dgrid__tools">
          <Show when={props.grid.config.filterFields}>
            {(fields) => (
              <Popover
                class="vui-dgrid__pop vui-dgrid__pop--wide"
                align="end"
                title={translate('velvetData.dataGrid.filters')}
                trigger={
                  <Button size="sm" variant="secondary" iconLeft="filter">
                    {translate('velvetData.dataGrid.filters')}
                    <Show when={props.grid.view.activeFilters() > 0}>
                      <Count value={props.grid.view.activeFilters()} size="sm" class="vui-dgrid__count" />
                    </Show>
                  </Button>
                }
              >
                <QueryBuilder
                  fields={fields()}
                  value={props.grid.view.query()}
                  onValueChange={props.grid.view.setQuery}
                  clearable
                />
                <Show when={props.grid.view.activeFilters() > 0}>
                  <div class="vui-dgrid__popfoot">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => props.grid.view.setQuery(props.grid.view.initial().query)}
                    >
                      {translate('velvetData.dataGrid.resetFilters')}
                    </Button>
                  </div>
                </Show>
              </Popover>
            )}
          </Show>
          <Show when={props.grid.config.columnManager}>
            <Popover
              class="vui-dgrid__pop"
              align="end"
              trigger={
                <Button size="sm" variant="secondary" iconLeft="sliders">
                  {translate('velvetData.dataGrid.columns')}
                </Button>
              }
            >
              <ColumnManager
                columns={managedColumns()}
                value={props.grid.view.columnState()}
                resetValue={props.grid.view.initial().columns}
                pinRight
                minVisible={1}
                onValueChange={props.grid.view.setColumnState}
              />
            </Popover>
          </Show>
          <Show when={props.grid.config.onExport !== undefined}>
            <Button
              size="sm"
              variant="secondary"
              iconLeft="download"
              onClick={() => exportGridRows(props.grid.view.rows(), props.grid.view.cols(), props.grid.config.onExport)}
            >
              {translate('velvetData.dataGrid.export')}
            </Button>
          </Show>
          <Show when={!props.grid.view.isDefault()}>
            <Button size="sm" variant="ghost" iconLeft="rotate-ccw" onClick={props.grid.view.reset}>
              {translate('velvetData.dataGrid.resetView')}
            </Button>
          </Show>
          {props.grid.config.toolbarEnd}
          <Show when={props.grid.config.viewSettings}>
            <GridViewSettings grid={props.grid} />
          </Show>
        </div>
      </div>
    </Show>
  );
};

import { Button } from '@jankrajewskiit/ui/bare';
import { createRowIdentity, cx, type RowKey } from '@jankrajewskiit/ui/common';
import { createEffect, createMemo, createSignal, type JSX, mergeProps, onCleanup, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { createGridActiveCell } from './createGridActiveCell';
import { createGridExpansion } from './createGridExpansion';
import { createGridKeyboard } from './createGridKeyboard';
import { createGridLayout } from './createGridLayout';
import { createGridSelection } from './createGridSelection';
import { createGridView } from './createGridView';
import { createGridWindow, type GridWindow } from './createGridWindow';
import { createVirtualKeys } from './createVirtualKeys';
import type { DataGridController } from './dataGridController';
import type { DataGridProps } from './dataGridTypes';
import { GridBody } from './GridBody';
import { DEFAULT_GRID_HEIGHT } from './gridColumns';
import { GridEmpty } from './GridEmpty';
import { GridFooter } from './GridFooter';
import { GridHeader } from './GridHeader';
import { GridToolbar } from './GridToolbar';

/**
 * Advanced data grid. Spreadsheet core: single active cell, arrows / Home / End / PageUp/Down, Enter / F2 / typing edits,
 * Enter commits ↓, Tab →, Esc cancels, ⌘C copies; sortable headers, resizable columns, sticky header.
 * Optional layers, each one prop: toolbar search (`searchable`), Filters popover with a QueryBuilder (`filterFields`),
 * Columns popover with ColumnManager (`columnManager`), Export (`onExport`; null = CSV download), row checkboxes with
 * select-all + bulk bar (`selectable`, `bulkActions`; Space toggles), expandable detail rows (`renderDetail`; Enter on a
 * read-only cell toggles), frozen columns with a shadow on horizontal scroll, "Showing X of Y" footer.
 * Use Table for simple read-only lists.
 */
export const DataGrid = <T extends object>(props: DataGridProps<T>): JSX.Element => {
  const p = mergeProps(
    {
      rowKey: 'id',
      height: DEFAULT_GRID_HEIGHT,
      stickyFirst: true,
      rowNumbers: true,
      selectable: false,
      searchable: false,
      columnManager: false,
      footer: false,
    } satisfies Partial<DataGridProps<T>>,
    props,
  );
  const [scrolled, setScrolled] = createSignal(false);
  const [scrolledRight, setScrolledRight] = createSignal(false);
  const [gridElement, setGridElement] = createSignal<HTMLDivElement>();
  const translate = useTranslate();
  const identity = createRowIdentity<T>(
    () => p.rowKey,
    () => p.getRowId,
  );

  const sourceKeys = createVirtualKeys(
    () => p.rows,
    (row) => identity(row),
    'DataGrid',
  );
  const identities = createMemo(() => {
    const keys = sourceKeys.keys();
    const result = new Map<T, RowKey>();
    p.rows.forEach((row, index) => {
      const key = keys[index];
      if (key !== undefined) result.set(row, key);
    });
    return result;
  });
  const keyOf = (row: T, _index: number) => identities().get(row) ?? identity(row);
  const view = createGridView<T>(() => p);
  const rowKeys = createVirtualKeys(view.rows, keyOf, 'DataGrid');
  const layout = createGridLayout<T>({
    cols: view.cols,
    rowNumbers: () => p.rowNumbers,
    selectable: () => p.selectable,
    widths: view.widths,
    setWidth: view.setWidth,
  });
  const selection = createGridSelection<T>({
    selected: () => p.selected,
    onChange: (keys) => p.onSelectionChange?.(keys),
    defaultSelected: p.defaultSelected,
    dataKey: () => p.dataKey,
    rows: () => p.rows,
    view: view.rows,
    keyOf,
  });
  const expansion = createGridExpansion(sourceKeys.keys, () => p.dataKey);
  const [getWindow, setWindow] = createSignal<GridWindow>();
  const active = createGridActiveCell<T>({
    getGrid: gridElement,
    cols: view.cols,
    view: view.rows,
    rows: () => p.rows,
    keyOf,
    ensureVisible: (index) => getWindow()?.ensureVisible(index),
    onRowsChange: (rows, change) => p.onRowsChange?.(rows, change),
    onEditError: (error, change) => p.onEditError?.(error, change),
    invalidNumberText: () => p.invalidNumberText ?? translate('velvetData.dataGrid.invalidNumber'),
    saveErrorText: () => p.saveErrorText ?? translate('velvetData.dataGrid.saveError'),
    dataKey: () => p.dataKey,
    canEdit: () => !!p.onRowsChange && !p.loading && !p.error,
  });
  const recordsByKey = createMemo(() => new Map(view.rows().map((row, index) => [keyOf(row, index), row])));
  const window = createGridWindow({
    config: () => p,
    keys: rowKeys,
    records: recordsByKey,
    layout: layout.template,
    expansion,
    viewport: gridElement,
    active: active.cell,
    edit: active.edit,
  });
  setWindow(window);
  const onKey = createGridKeyboard<T>({
    active,
    selection,
    expansion,
    cols: view.cols,
    view: view.rows,
    keyOf,
    selectable: () => p.selectable,
    hasDetail: () => !!p.renderDetail,
  });
  const grid: DataGridController<T> = { config: p, view, selection, layout, active, expansion, keyOf, window, rowKeys };
  createEffect(() => {
    layout.template();
    const element = gridElement();
    if (!element) return;
    const update = () => {
      const currentElement = gridElement();
      if (!currentElement) return;
      setScrolled(currentElement.scrollLeft > 2);
      setScrolledRight(currentElement.scrollWidth - currentElement.clientWidth - currentElement.scrollLeft > 2);
    };
    const frame = requestAnimationFrame(update);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(element);
    onCleanup(() => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    });
  });

  return (
    <div class={cx('vui-dgrid', p.class)}>
      <GridToolbar grid={grid} />
      <Show when={p.error}>
        <div role="alert" class="vui-dgrid__view-error">
          {p.error}
          <Show when={p.onRetry}>
            <Button size="xs" onClick={() => p.onRetry?.()}>
              {translate('velvetData.dataGrid.retry')}
            </Button>
          </Show>
        </div>
      </Show>
      <Show when={view.error()}>
        <div role="status" class="vui-dgrid__view-error">
          {translate('velvetData.dataGrid.viewError')}
          <Button size="xs" variant="ghost" onClick={view.reset}>
            {translate('velvetData.dataGrid.resetView')}
          </Button>
        </div>
      </Show>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- grid uses roving tabindex: the active gridcell holds the tab stop */}
      <div
        ref={setGridElement}
        role="grid"
        aria-label={p.label ?? translate('velvetData.dataGrid.label')}
        aria-rowcount={window.rowCount()}
        aria-colcount={view.cols().length + (p.selectable ? 1 : 0)}
        aria-multiselectable={p.selectable || undefined}
        aria-busy={p.loading || undefined}
        class={cx('vui-grid', scrolled() && 'vui-grid--scrolled', scrolledRight() && 'vui-grid--scrolled-right')}
        style={{
          height: `${p.height}px`,
          '--grid-tpl': layout.template(),
          '--grid-row-height': p.rowHeight === undefined ? undefined : `${window.rowHeight()}px`,
        }}
        onKeyDown={onKey}
        onScroll={(event) => {
          setScrolled(event.currentTarget.scrollLeft > 2);
          setScrolledRight(
            event.currentTarget.scrollWidth - event.currentTarget.clientWidth - event.currentTarget.scrollLeft > 2,
          );
          window.update();
        }}
      >
        <GridHeader grid={grid} />
        <Show when={p.loading}>
          <div role="status" class="vui-grid__empty">
            {translate('velvetData.dataGrid.loading')}
          </div>
        </Show>
        <Show when={!p.loading && !p.error && view.rows().length === 0}>
          <GridEmpty grid={grid} />
        </Show>
        <GridBody grid={grid} />
      </div>
      <GridFooter grid={grid} />
    </div>
  );
};

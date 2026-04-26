
import type { Props } from '@jankrajewskiit/ui';
import { Card, classNames } from '@jankrajewskiit/ui';
import styles from './DataGridPro.module.css';
import type {
  DataGridProColumn,
  DataGridProColumnPin,
  DataGridProColumnPinning,
  DataGridProProps,
  DataGridProSortState,
} from './DataGridPro.types';
import DataGridProBody from './DataGridProBody/DataGridProBody';
import DataGridProHeader from './DataGridProHeader/DataGridProHeader';
import DataGridProToolbar from './DataGridProToolbar/DataGridProToolbar';
import useDataGridProState from './useDataGridProState';

const DataGridPro = <T extends Record<string, unknown>>(props: Props<DataGridProProps<T>>) => {
  const state = useDataGridProState(props);

  return (
    <Card class={classNames(styles.wrapper, props.class)}>
      <DataGridProToolbar
        show={state.showToolbar}
        filterable={props.filterable}
        filterQuery={state.filterQuery}
        onFilterInput={state.handleFilterInput}
        rowCount={state.rowCount}
        selectable={state.selectable}
        selectedCount={() => state.selectedSet().size}
        hasPersistence={state.hasPersistence}
        hasPersistedLayout={state.hasPersistedLayout}
        onClearSelection={state.clearSelection}
        onResetView={state.resetView}
        onResetPersistedLayout={state.resetPersistedLayout}
        onImportClick={state.handleImportClick}
        onExportSettings={state.exportSettings}
        setImportFileInputRef={state.setImportFileInputRef}
        onImportFile={state.handleImportFile}
        setColumnMenuWrapRef={state.setColumnMenuWrapRef}
        columnMenuOpen={state.columnMenuOpen}
        onToggleColumnMenu={state.toggleColumnMenu}
        orderedColumns={state.orderedColumns}
        isColumnVisible={state.isColumnVisible}
        disableUncheckColumn={state.disableUncheckColumn}
        onToggleColumnVisibility={state.handleColumnVisibilityToggle}
        onResetColumns={state.resetColumns}
      />
      <div
        class={styles.viewport}
        role="grid"
        aria-rowcount={state.rowCount()}
        aria-colcount={state.visibleColumns().length + (state.selectable() ? 1 : 0)}
        aria-multiselectable={state.selectable() ? 'true' : undefined}
        style={{ '--viewport-height': `${String(state.viewportHeight())}px` }}
        onScroll={state.handleScroll}
      >
        <div class={styles.grid} style={{ '--grid-width': `${String(state.gridWidth())}px` }}>
          <DataGridProHeader
            headerHeight={state.headerHeight}
            selectable={state.selectable}
            allVisibleSelected={state.allVisibleSelected}
            onToggleAllVisible={state.toggleAllVisible}
            visibleColumns={state.visibleColumns}
            isColumnSortable={state.isColumnSortable}
            sortKey={state.sortKey}
            sortDirection={state.sortDirection}
            onSort={state.handleSort}
            getAriaSort={state.getAriaSort}
            getColumnPin={state.getColumnPin}
            getColumnStyle={state.getColumnStyle}
            reorderable={state.reorderable}
            draggingColumnKey={state.draggingColumnKey}
            dragOverColumnKey={state.dragOverColumnKey}
            onHeaderDragStart={state.handleHeaderDragStart}
            onHeaderDragOver={state.handleHeaderDragOver}
            onHeaderDrop={state.handleHeaderDrop}
            onHeaderDragEnd={state.handleHeaderDragEnd}
            onResizeStart={state.handleResizeStart}
          />

          <DataGridProBody
            hasRows={state.hasRows}
            bodyHeight={state.bodyHeight}
            totalRowsHeight={state.totalRowsHeight}
            offsetY={state.offsetY}
            visibleRows={state.visibleRows}
            striped={() => props.striped ?? false}
            rowHeight={state.rowHeight}
            selectable={state.selectable}
            selectedSet={state.selectedSet}
            onToggleRow={state.toggleRow}
            visibleColumns={state.visibleColumns}
            getColumnPin={state.getColumnPin}
            getColumnStyle={state.getColumnStyle}
          />
        </div>
      </div>
    </Card>
  );
};

export { DataGridPro };
export type {
  DataGridProColumn,
  DataGridProColumnPin,
  DataGridProColumnPinning,
  DataGridProProps,
  DataGridProSortState,
};

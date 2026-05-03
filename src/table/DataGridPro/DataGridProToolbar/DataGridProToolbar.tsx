import type { Props } from '@jankrajewskiit/ui';
import { Button, Checkbox, classNames, Input, Text, useI18n } from '@jankrajewskiit/ui';
import { type Accessor, For, type JSX, Show } from 'solid-js';

import styles from './DataGridProToolbar.module.css';

interface DataGridProToolbarColumn {
  key: string;
  header: string;
}

interface DataGridProToolbarProps {
  show: Accessor<boolean>;
  filterable: boolean | undefined;
  filterQuery: Accessor<string>;
  onFilterInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  rowCount: Accessor<number>;
  selectable: Accessor<boolean>;
  selectedCount: Accessor<number>;
  hasPersistence: Accessor<boolean>;
  hasPersistedLayout: Accessor<boolean>;
  onClearSelection: () => void;
  onResetView: () => void;
  onResetPersistedLayout: () => void;
  onImportClick: () => void;
  onExportSettings: () => void;
  setImportFileInputRef: (value: HTMLInputElement) => void;
  onImportFile: JSX.EventHandler<HTMLInputElement, Event>;
  setColumnMenuWrapRef: (value: HTMLDivElement) => void;
  columnMenuOpen: Accessor<boolean>;
  onToggleColumnMenu: () => void;
  orderedColumns: Accessor<readonly DataGridProToolbarColumn[]>;
  isColumnVisible: (key: string) => boolean;
  disableUncheckColumn: (key: string) => boolean;
  onToggleColumnVisibility: (key: string) => void;
  onResetColumns: () => void;
}

const DataGridProToolbar = (props: Props<DataGridProToolbarProps>) => {
  const { ts } = useI18n();

  return (
    <Show when={props.show()}>
      <div class={classNames(styles.toolbar, props.class)}>
        <div class={styles.toolbarLeft}>
          <Show when={props.filterable}>
            <Input
              type="search"
              value={props.filterQuery()}
              onInput={props.onFilterInput}
              aria-label={ts('dataGrid.filterRows')}
              placeholder={ts('dataGrid.filterRows')}
              class={classNames(styles.filterWrap, styles.filterInput)}
            />
          </Show>
          <div class={styles.summary}>
            <Text as="span" variant="labelMd" tone="secondary" class={styles.resultsCount}>
              {ts('dataGrid.rowsCount', { count: props.rowCount() })}
            </Text>
            <Show when={props.selectable() && props.selectedCount() > 0}>
              <Text as="span" variant="caption" tone="primary" class={styles.selectionSummary}>
                {ts('dataGrid.selectedCount', { count: props.selectedCount() })}
              </Text>
            </Show>
          </div>
          <Show when={props.hasPersistence()}>
            <span
              class={classNames(
                styles.persistenceBadge,
                props.hasPersistedLayout() ? styles.badgePersisted : styles.badgeDefault,
              )}
            >
              {props.hasPersistedLayout() ? ts('common.persisted') : ts('common.default')}
            </span>
          </Show>
        </div>
        <div class={styles.toolbarRight}>
          <div class={styles.toolbarGroup}>
            <Button
              variant="ghost"
              size="sm"
              class={styles.toolbarButton}
              onClick={props.onClearSelection}
              disabled={props.selectedCount() === 0}
            >
              {ts('dataGrid.clearSelection')}
            </Button>
            <Button variant="ghost" size="sm" class={styles.toolbarButton} onClick={props.onResetView}>
              {ts('dataGrid.resetView')}
            </Button>
            <Show when={props.hasPersistence()}>
              <Button variant="ghost" size="sm" class={styles.toolbarButton} onClick={props.onResetPersistedLayout}>
                {ts('dataGrid.resetSavedLayout')}
              </Button>
            </Show>
          </div>
          <div class={styles.toolbarGroup}>
            <Button variant="ghost" size="sm" class={styles.toolbarButton} onClick={props.onImportClick}>
              {ts('common.importJson')}
            </Button>
            <Button variant="ghost" size="sm" class={styles.toolbarButton} onClick={props.onExportSettings}>
              {ts('common.exportJson')}
            </Button>
          </div>
          <input
            ref={props.setImportFileInputRef}
            type="file"
            accept="application/json"
            class={styles.hiddenInput}
            onChange={(event) => props.onImportFile(event)}
          />
          <div ref={props.setColumnMenuWrapRef} class={styles.columnMenuWrap}>
            <Button
              variant="ghost"
              size="sm"
              class={styles.toolbarButton}
              onClick={props.onToggleColumnMenu}
              aria-haspopup="dialog"
              aria-expanded={props.columnMenuOpen() ? 'true' : 'false'}
            >
              {ts('dataGrid.columns')}
            </Button>
            <Show when={props.columnMenuOpen()}>
              <div class={styles.columnMenu} role="group" aria-label={ts('columnManager.columnVisibility')}>
                <For each={props.orderedColumns()}>
                  {(column) => (
                    <Checkbox
                      class={styles.columnOption}
                      checked={props.isColumnVisible(column.key)}
                      disabled={props.disableUncheckColumn(column.key)}
                      onChange={() => props.onToggleColumnVisibility(column.key)}
                      label={column.header}
                    />
                  )}
                </For>
                <Button variant="ghost" size="sm" class={styles.toolbarButtonSmall} onClick={props.onResetColumns}>
                  {ts('columnManager.resetColumns')}
                </Button>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default DataGridProToolbar;

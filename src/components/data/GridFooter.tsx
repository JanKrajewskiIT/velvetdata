import { Text } from '@jankrajewskiit/ui/bare';
import { Show } from 'solid-js';

import { useTranslateRich } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import styles from './GridFooter.module.css';
import { GridSelectedCount } from './GridSelectedCount';

export interface GridFooterProps<T extends object> {
  grid: DataGridController<T>;
}

/** "Showing X of Y" line, the selected count while rows are selected, and the consumer's `footer` node. */
export const GridFooter = <T extends object>(props: GridFooterProps<T>) => {
  const translateRich = useTranslateRich();
  return (
    <Show when={props.grid.config.footer}>
      <div class={styles.root}>
        <Text as="span" variant="caption" tone="tertiary" tabular class={styles.count} aria-live="polite">
          {translateRich('velvetData.dataGrid.showing', {
            shown: props.grid.view.rows().length,
            total: props.grid.config.rowCount ?? props.grid.config.rows.length,
            b: (children) => (
              <Text as="b" variant="label-sm" tone="primary" tabular>
                {children}
              </Text>
            ),
          })}
        </Text>
        <Show when={props.grid.config.selectable && props.grid.selection.selectedKeys().length > 0}>
          <GridSelectedCount count={props.grid.selection.selectedKeys().length} variant="caption" tone="primary" />
        </Show>
        <Show when={typeof props.grid.config.footer !== 'boolean'}>
          <Text as="div" variant="caption" tone="tertiary" class={styles.end}>
            {props.grid.config.footer}
          </Text>
        </Show>
      </div>
    </Show>
  );
};

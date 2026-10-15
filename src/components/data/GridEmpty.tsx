import { EmptyText } from '@jankrajewskiit/ui/bare';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import styles from './GridEmpty.module.css';

export interface GridEmptyProps<T extends object> {
  grid: DataGridController<T>;
}

/** Message for an empty view, naming the search term and active filters that caused it. */
export const GridEmpty = <T extends object>(props: GridEmptyProps<T>) => {
  const translate = useTranslate();
  const message = () => {
    const count = props.grid.view.activeFilters();
    const term = props.grid.view.search();
    if (term && count) return translate('velvetData.dataGrid.noRowsTermFilters', { term, count });
    if (term) return translate('velvetData.dataGrid.noRowsTerm', { term });
    if (count) return translate('velvetData.dataGrid.noRowsFilters', { count });
    return translate('velvetData.dataGrid.noRows');
  };
  return <EmptyText class={styles.root}>{message()}</EmptyText>;
};

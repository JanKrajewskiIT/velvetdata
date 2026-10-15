import { Text } from '@jankrajewskiit/ui/bare';

import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';
import styles from './ColumnManagerFooter.module.css';

export interface ColumnManagerFooterProps {
  manager: ColumnManagerController;
}

export const ColumnManagerFooter = (props: ColumnManagerFooterProps) => {
  const translate = useTranslate();
  const visibleCount = () => props.manager.model.state().filter((c) => c.visible).length;
  const pinnedText = () => {
    const pinned = props.manager.model.pinnedCount();
    if (!pinned) return translate('velvetData.columnManager.nothingPinned');
    return props.manager.config.maxPinned != null
      ? translate('velvetData.columnManager.pinnedOfMax', { count: pinned, max: props.manager.config.maxPinned })
      : translate('velvetData.columnManager.pinnedCount', { count: pinned });
  };
  return (
    <div class={styles.root}>
      <Text as="span" variant="caption" tone="tertiary" tabular>
        {translate('velvetData.columnManager.visibleCount', {
          visible: visibleCount(),
          total: props.manager.model.state().length,
        })}
      </Text>
      <Text as="span" variant="caption" tone="tertiary" tabular>
        {pinnedText()}
      </Text>
    </div>
  );
};

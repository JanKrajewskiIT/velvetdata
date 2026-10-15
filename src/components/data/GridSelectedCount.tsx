import { Text } from '@jankrajewskiit/ui/bare';

import { useTranslateRich } from '../../i18n/useTranslate';
import styles from './GridSelectedCount.module.css';

export interface GridSelectedCountProps {
  count: number;
  variant?: 'body-sm' | 'caption';
  tone?: 'primary' | 'brand';
}

export const GridSelectedCount = (props: GridSelectedCountProps) => {
  const translateRich = useTranslateRich();
  return (
    <Text as="span" variant={props.variant ?? 'body-sm'} tone="secondary" tabular class={styles.root}>
      {translateRich('velvetData.dataGrid.selected', {
        count: props.count,
        b: (children) => (
          <Text
            as="b"
            variant={props.variant === 'caption' ? 'label-sm' : 'label'}
            tone={props.tone ?? 'brand'}
            tabular
          >
            {children}
          </Text>
        ),
      })}
    </Text>
  );
};

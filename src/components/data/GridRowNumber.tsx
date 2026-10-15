import { Text } from '@jankrajewskiit/ui/bare';

import styles from './GridRowNumber.module.css';

export interface GridRowNumberProps {
  index?: number;
}

export const GridRowNumber = (props: GridRowNumberProps) => (
  <Text
    as="div"
    variant="micro"
    mono
    tabular
    class={styles.root}
    data-header={props.index === undefined || undefined}
    aria-hidden="true"
  >
    {props.index === undefined ? '#' : props.index + 1}
  </Text>
);

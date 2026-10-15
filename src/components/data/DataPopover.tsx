import { Popover, type PopoverProps } from '@jankrajewskiit/ui/bare';
import { cx } from '@jankrajewskiit/ui/common';

import styles from './DataPopover.module.css';

export interface DataPopoverProps extends Pick<PopoverProps, 'trigger' | 'title' | 'label' | 'children'> {
  size?: 'sm' | 'lg';
}

export const DataPopover = (props: DataPopoverProps) => (
  <Popover
    align="end"
    title={props.title}
    label={props.label}
    trigger={props.trigger}
    class={cx(styles.root, props.size === 'lg' && styles.wide)}
  >
    <div class={styles.body}>{props.children}</div>
  </Popover>
);

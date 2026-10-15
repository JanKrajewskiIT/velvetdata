import { Checkbox } from '@jankrajewskiit/ui/bare';
import type { JSX } from 'solid-js';

import styles from './GridSelectionCell.module.css';

export interface GridSelectionCellProps {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  header?: boolean;
  style: JSX.CSSProperties;
  onChange: () => void;
}

export const GridSelectionCell = (props: GridSelectionCellProps) => (
  <div
    role={props.header ? 'columnheader' : 'gridcell'}
    class={styles.root}
    data-header={props.header || undefined}
    style={props.style}
  >
    <Checkbox
      tabIndex={props.header ? undefined : -1}
      aria-label={props.label}
      checked={props.checked}
      indeterminate={props.indeterminate}
      onChange={props.onChange}
    />
  </div>
);

import type { JSX } from 'solid-js';


import type { Props } from '@jankrajewskiit/ui';
import { classNames, TableCell, TableRow, Text } from '@jankrajewskiit/ui';
import styles from './TableAddRowAction.module.css';

interface TableAddRowActionProps {
  label: string;
  colSpan: number;
  onClick: () => void;
  icon?: JSX.Element;
}

const TableAddRowAction = (props: Props<TableAddRowActionProps>) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      props.onClick();
    }
  };

  return (
    <TableRow
      class={classNames(styles.row, props.class)}
      onClick={props.onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={props.label}
    >
      <TableCell colSpan={props.colSpan} class={classNames(styles.cell, styles.content)}>
        {props.icon && <span class={styles.icon}>{props.icon}</span>}
        <Text as="span" variant="labelMd" tone="primary">
          {props.label}
        </Text>
      </TableCell>
    </TableRow>
  );
};

export type { TableAddRowActionProps };
export default TableAddRowAction;

import type { ManagedColumn } from './columnManagerTypes';

export const columnCapabilities = (column: ManagedColumn) => ({
  hide: !column.locked && (column.canHide ?? column.hideable) !== false,
  pin: !column.locked && (column.canPin ?? column.pinnable) !== false,
  move: !column.locked && (column.canMove ?? column.movable) !== false,
});

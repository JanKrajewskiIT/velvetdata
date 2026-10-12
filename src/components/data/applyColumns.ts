import type { ColumnState } from './columnManagerTypes';

/** Visible columns in display order (left pins → middle → right pins), each with `pin` set. */
export const applyColumns = <T extends { key: string }>(
  columns: T[],
  state: ColumnState[],
): (T & { pin?: 'left' | 'right' })[] => {
  const ordered = [
    ...state.filter((s) => s.pin === 'left'),
    ...state.filter((s) => !s.pin),
    ...state.filter((s) => s.pin === 'right'),
  ];
  return ordered.flatMap((s) => {
    const column = s.visible ? columns.find((c) => c.key === s.key) : undefined;
    return column ? [{ ...column, pin: s.pin ?? undefined }] : [];
  });
};

import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createSignal } from 'solid-js';

export interface GridExpansion {
  open: Accessor<ReadonlySet<RowKey>>;
  toggleOpen: (key: RowKey) => void;
}

export const createGridExpansion = (
  keys: Accessor<readonly RowKey[]>,
  dataKey: Accessor<string | number | undefined>,
): GridExpansion => {
  const [open, setOpen] = createSignal<ReadonlySet<RowKey>>(new Set());
  let previousKey = dataKey();
  createEffect(() => {
    const known = new Set(keys());
    const reset = previousKey !== dataKey();
    previousKey = dataKey();
    setOpen((current) => {
      if (!reset && [...current].every((key) => known.has(key))) return current;
      return reset ? new Set<RowKey>() : new Set<RowKey>([...current].filter((key) => known.has(key)));
    });
  });
  const toggleOpen = (key: RowKey) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  return { open, toggleOpen };
};

import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createSignal } from 'solid-js';

export interface GridExpansion {
  open: Accessor<ReadonlySet<RowKey>>;
  toggleOpen: (key: RowKey) => void;
}

export const createGridExpansion = (): GridExpansion => {
  const [open, setOpen] = createSignal<ReadonlySet<RowKey>>(new Set());
  const toggleOpen = (key: RowKey) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  return { open, toggleOpen };
};

import { clamp, createFrameFocus, type RowKey } from '@jankrajewskiit/ui/common';
import { createSignal, type JSX } from 'solid-js';

import type { VirtualKeys } from './createVirtualKeys';
import type { VirtualRows } from './createVirtualRows';
import type { VirtualListConfig } from './virtualListTypes';
import { isRowControl } from './virtualRowTarget';

export const createVirtualKeyboard = <T>(
  p: VirtualListConfig<T>,
  rows: Pick<VirtualRows, 'count' | 'gap' | 'offsetAt' | 'first' | 'last'>,
  select: (index: number, item: T) => void,
  box: () => HTMLDivElement,
  keys: VirtualKeys,
) => {
  const [focusedKey, setFocusedKey] = createSignal<RowKey>();
  const focus = () => {
    const key = focusedKey();
    return key === undefined ? -1 : keys.indexOf(key);
  };
  const setFocus = (index: number) => setFocusedKey(keys.keys()[index]);
  const focusFrame = createFrameFocus(box);

  const goTo = (index: number) => {
    if (!rows.count()) return;
    const target = clamp(index, 0, rows.count() - 1);
    setFocus(target);
    const top = rows.offsetAt(target);
    const bottom = rows.offsetAt(target + 1) - rows.gap();
    const el = box();
    if (top < el.scrollTop) el.scrollTop = top;
    else if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight;
    focusFrame('[data-vi][tabindex="0"]');
  };

  const onKey: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (e) => {
    if (!rows.count() || isRowControl(e.target)) return;
    const page = Math.max(1, rows.last() - rows.first());
    const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page };
    const step = steps[e.key];
    const current = focus();
    const item = p.items[current];
    if (step !== undefined) {
      e.preventDefault();
      goTo((current < 0 ? rows.first() : current) + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(rows.count() - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && current >= 0 && item !== undefined) {
      e.preventDefault();
      select(current, item);
      if (e.key === 'Enter') p.onActivate?.(item, current);
    }
  };

  return { focus, setFocus, goTo, onKey } as const;
};

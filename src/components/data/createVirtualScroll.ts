import { createEffect, createSignal, type JSX, on } from 'solid-js';

import type { VirtualListConfig } from './virtualListTypes';

export const createVirtualScroll = <T>(p: VirtualListConfig<T>) => {
  const [scrollTop, setScrollTop] = createSignal(0);
  let endReported = false;

  createEffect(
    on(
      () => p.items.length,
      () => (endReported = false),
      { defer: true },
    ),
  );

  const onScroll: JSX.EventHandler<HTMLDivElement, Event> = (e) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    if (
      p.onEndReached &&
      !p.loading &&
      !endReported &&
      el.scrollHeight - el.scrollTop - el.clientHeight < p.endThreshold
    ) {
      endReported = true;
      p.onEndReached();
    }
  };

  return { scrollTop, onScroll } as const;
};

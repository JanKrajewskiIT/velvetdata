import { type Accessor, onCleanup } from 'solid-js';

/** Coalesces focus requests after rendering and cancels pending work with its owner. */
export const createFrameFocus = (
  root: Accessor<HTMLElement | undefined>,
  options: FocusOptions = { preventScroll: true },
) => {
  let frame = 0;
  onCleanup(() => cancelAnimationFrame(frame));
  return (selector?: string) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const element = root();
      const target = selector ? element?.querySelector<HTMLElement>(selector) : element;
      if (target?.isConnected) target.focus(options);
    });
  };
};

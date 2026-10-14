import { type Accessor, createEffect, onCleanup, onMount, untrack } from 'solid-js';

import type { QueryField } from '../patterns/queryModel';
import { parseGridView, serializeGridView } from './gridViewCodec';
import type { GridViewState } from './gridViewTypes';

interface GridPersistenceOptions {
  key: Accessor<string | undefined>;
  view: Accessor<GridViewState>;
  restore: (view: GridViewState) => void;
  onError: (error: Error) => void;
  fields: Accessor<readonly QueryField[]>;
}

export const createGridPersistence = (options: GridPersistenceOptions): void => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { key: string; json: string; view: GridViewState } | undefined;
  let lastWritten: GridViewState | undefined;
  let activeKey: string | undefined;
  let initialized = false;
  const reportError = (cause: unknown) =>
    untrack(() =>
      options.onError(cause instanceof Error ? cause : new Error('Grid view storage operation failed.', { cause })),
    );
  const flush = () => {
    clearTimeout(timer);
    if (!pending) return;
    const value = pending;
    pending = undefined;
    try {
      window.localStorage.setItem(value.key, value.json);
    } catch (cause) {
      reportError(cause);
      return;
    }
    lastWritten = value.view;
  };
  onCleanup(flush);
  onMount(() => {
    createEffect(() => {
      const key = options.key();
      options.view();
      if (!initialized || key !== activeKey) {
        flush();
        activeKey = key;
        initialized = true;
        lastWritten = undefined;
        if (key) {
          let saved: GridViewState | undefined;
          try {
            const json = window.localStorage.getItem(key);
            if (json) saved = parseGridView(json, options.fields());
          } catch (cause) {
            // Preserve invalid settings until the view changes instead of overwriting them during hydration.
            lastWritten = untrack(options.view);
            reportError(cause);
            return;
          }
          if (saved) {
            untrack(() => options.restore(saved));
            lastWritten = untrack(options.view);
          }
        }
      }
      const view = untrack(options.view);
      clearTimeout(timer);
      pending = undefined;
      if (!key || view === lastWritten) return;
      let json: string;
      try {
        json = serializeGridView(view);
      } catch (cause) {
        reportError(cause);
        return;
      }
      pending = { key, json, view };
      timer = setTimeout(flush, 250);
    });
  });
};

import { createOperation, reportAsyncError } from '@jankrajewskiit/ui/common';
import { type Accessor, createEffect, createSignal, type JSX, on, onCleanup } from 'solid-js';

import type { VirtualListConfig } from './virtualListTypes';

export const createVirtualScroll = <T>(p: VirtualListConfig<T>, viewport: Accessor<HTMLDivElement | undefined>) => {
  const [scrollTop, setScrollTop] = createSignal(0);
  let endReported = false;
  const [failed, setFailed] = createSignal(false);
  const [revision, setRevision] = createSignal(0);
  const operation = createOperation();
  let controller: AbortController | undefined;
  onCleanup(() => controller?.abort());
  const check = async () => {
    const element = viewport();
    if (
      !element ||
      !p.onEndReached ||
      p.hasMore === false ||
      p.loading ||
      p.error ||
      failed() ||
      endReported ||
      operation.busy()
    )
      return;
    if (element.scrollHeight - element.scrollTop - element.clientHeight > Math.max(0, p.endThreshold)) return;
    const run = operation.begin();
    if (!run) return;
    const request = new AbortController();
    controller = request;
    endReported = true;
    try {
      await p.onEndReached(request.signal);
    } catch (cause) {
      if (run.isCurrent()) {
        setFailed(true);
        if (p.onLoadError) p.onLoadError(cause);
        else reportAsyncError(cause);
      }
    } finally {
      if (controller === request) controller = undefined;
      run.finish();
    }
  };

  createEffect(
    on(
      () => p.items.length,
      () => {
        endReported = false;
        setFailed(false);
      },
      { defer: true },
    ),
  );
  createEffect(
    on(
      () => p.dataKey,
      () => {
        controller?.abort();
        operation.invalidate();
        endReported = false;
        setFailed(false);
        setScrollTop(0);
        const element = viewport();
        if (element) element.scrollTop = 0;
      },
      { defer: true },
    ),
  );
  const schedule = () => {
    void check().catch(reportAsyncError);
  };
  createEffect(
    on(
      () =>
        [viewport(), p.items.length, p.loading, p.hasMore, p.error, p.height, revision(), operation.busy()] as const,
      ([element]) => {
        if (!element) return;
        const frame = requestAnimationFrame(schedule);
        const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule);
        observer?.observe(element);
        onCleanup(() => {
          cancelAnimationFrame(frame);
          observer?.disconnect();
        });
      },
    ),
  );

  const onScroll: JSX.EventHandler<HTMLDivElement, Event> = (e) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    schedule();
  };

  const retry = () => {
    endReported = false;
    setFailed(false);
    setRevision((value) => value + 1);
  };
  return { scrollTop, onScroll, failed, retry, pending: operation.busy };
};

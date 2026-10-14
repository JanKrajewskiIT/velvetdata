import { batch, createEffect, createSignal, getOwner, on, onCleanup, onMount } from 'solid-js';

import { mergeTradingPoints } from '../charts/tradingData';
import type { TradingFeedStatus, TradingViewChartPoint } from '../charts/tradingTypes';
import type { TradingViewFeed, TradingViewFeedContext, TradingViewFeedOptions } from './tradingFeedTypes';
import { DEFAULT_TRADING_MAX_POINTS, DEFAULT_TRADING_STALE_AFTER_MS } from './tradingFeedTypes';

export interface TradingFeedRun {
  readonly context: TradingViewFeedContext;
  readonly signal: AbortSignal;
  readonly receive: (points: readonly TradingViewChartPoint[]) => boolean;
  readonly ready: () => void;
  readonly fail: (cause: unknown) => void;
  readonly reconnecting: () => void;
}

export const createTradingFeed = (
  options: TradingViewFeedOptions,
  start: (run: TradingFeedRun) => () => void,
): TradingViewFeed => {
  if (!getOwner()) throw new Error('Trading feeds require a Solid owner.');
  const maxPoints = options.maxPoints ?? DEFAULT_TRADING_MAX_POINTS;
  if (!Number.isSafeInteger(maxPoints) || maxPoints <= 0) throw new RangeError('maxPoints must be a positive integer.');
  const [data, setData] = createSignal<readonly TradingViewChartPoint[]>([]);
  const [status, setStatus] = createSignal<TradingFeedStatus>('idle');
  const [error, setError] = createSignal<Error>();
  const [revision, setRevision] = createSignal(0);
  const [lastUpdated, setLastUpdated] = createSignal<number>();
  const [stale, setStale] = createSignal(false);
  const staleAfterMs = options.staleAfterMs ?? DEFAULT_TRADING_STALE_AFTER_MS;
  if (!Number.isFinite(staleAfterMs) || staleAfterMs <= 0 || staleAfterMs > 2_147_483_647)
    throw new RangeError('staleAfterMs must be within the positive browser timer range.');
  onMount(() => {
    createEffect(() => {
      const at = lastUpdated();
      if (at === undefined) return;
      const timer = setTimeout(() => setStale(true), Math.max(0, at + staleAfterMs - Date.now()));
      onCleanup(() => clearTimeout(timer));
    });
    createEffect(
      on(
        () => {
          const context = options.context();
          return [context.symbol, context.interval, options.enabled?.() ?? true, revision()] as const;
        },
        ([symbol, interval, enabled]) => {
          const context = { symbol, interval };
          const controller = new AbortController();
          let stop: (() => void) | undefined;
          onCleanup(() => {
            controller.abort();
            stop?.();
          });
          batch(() => {
            setData([]);
            setError(undefined);
            setLastUpdated(undefined);
            setStale(false);
            setStatus(enabled ? 'pending' : 'idle');
          });
          const fail = (cause: unknown) => {
            if (controller.signal.aborted) return;
            batch(() => {
              setError(cause instanceof Error ? cause : new Error('Trading feed failed.', { cause }));
              setStatus('error');
            });
          };
          const ready = () => {
            if (controller.signal.aborted) return;
            batch(() => {
              setError(undefined);
              setStatus('live');
            });
          };
          const receive = (points: readonly TradingViewChartPoint[]) => {
            if (controller.signal.aborted) return false;
            let next: readonly TradingViewChartPoint[];
            try {
              next = mergeTradingPoints(data(), points, maxPoints);
            } catch (cause) {
              fail(cause);
              return false;
            }
            batch(() => {
              setData(next);
              setLastUpdated(Date.now());
              setStale(false);
              ready();
            });
            return true;
          };
          try {
            if (!symbol || !interval) throw new Error('Trading feed symbol and interval must be nonempty.');
            setData(mergeTradingPoints([], options.initialData?.(context) ?? [], maxPoints));
            setStale(data().length > 0);
            if (enabled)
              stop = start({
                context,
                signal: controller.signal,
                receive,
                ready,
                fail,
                reconnecting: () => {
                  if (!controller.signal.aborted) setStatus('reconnecting');
                },
              });
          } catch (cause) {
            fail(cause);
          }
        },
      ),
    );
  });
  return { data, status, error, lastUpdated, stale, restart: () => setRevision((value) => value + 1) };
};

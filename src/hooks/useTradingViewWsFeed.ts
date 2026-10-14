import type { TradingViewChartPoint } from '../charts/tradingTypes';
import { createTradingFeed } from './createTradingFeed';
import type { TradingViewFeed, TradingViewFeedContext, TradingViewFeedOptions } from './tradingFeedTypes';
import { createTradingRetry, type TradingRetryOptions } from './tradingRetry';

export interface TradingViewSubscriptionOptions {
  readonly context: TradingViewFeedContext;
  readonly signal: AbortSignal;
  readonly onData: (points: readonly TradingViewChartPoint[]) => void;
  readonly onOpen: () => void;
  readonly onError: (cause: unknown) => void;
}

export interface TradingViewWsFeedOptions extends TradingViewFeedOptions {
  readonly subscribe: (options: TradingViewSubscriptionOptions) => () => void;
  readonly retry?: TradingRetryOptions;
}

export const useTradingViewWsFeed = (options: TradingViewWsFeedOptions): TradingViewFeed =>
  createTradingFeed(options, (run) => {
    let sequence = 0;
    let stop: (() => void) | undefined;
    let controller: AbortController | undefined;
    const disconnect = () => {
      sequence++;
      controller?.abort();
      const cleanup = stop;
      stop = undefined;
      cleanup?.();
    };
    const recovery = createTradingRetry(run, options.retry, () => connect());
    const connect = () => {
      disconnect();
      const connection = new AbortController();
      controller = connection;
      const current = sequence;
      const live = () => current === sequence && !run.signal.aborted && !connection.signal.aborted;
      try {
        const cleanup = options.subscribe({
          context: run.context,
          signal: connection.signal,
          onData: (points) => {
            if (live() && run.receive(points)) recovery.reset();
          },
          onOpen: () => {
            if (live()) run.ready();
          },
          onError: (cause) => {
            if (!live()) return;
            disconnect();
            recovery.fail(cause);
          },
        });
        if (live()) stop = cleanup;
        else cleanup();
      } catch (cause) {
        if (live()) {
          disconnect();
          recovery.fail(cause);
        }
      }
    };
    connect();
    return () => {
      recovery.dispose();
      disconnect();
    };
  });

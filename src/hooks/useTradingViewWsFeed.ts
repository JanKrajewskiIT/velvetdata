import type { TradingViewChartPoint } from '../charts/tradingTypes';
import { createTradingFeed } from './createTradingFeed';
import type { TradingViewFeed, TradingViewFeedContext, TradingViewFeedOptions } from './tradingFeedTypes';

export interface TradingViewSubscriptionOptions {
  readonly context: TradingViewFeedContext;
  readonly signal: AbortSignal;
  readonly onData: (points: readonly TradingViewChartPoint[]) => void;
  readonly onOpen: () => void;
  readonly onError: (cause: unknown) => void;
}

export interface TradingViewWsFeedOptions extends TradingViewFeedOptions {
  readonly subscribe: (options: TradingViewSubscriptionOptions) => () => void;
}

export const useTradingViewWsFeed = (options: TradingViewWsFeedOptions): TradingViewFeed =>
  createTradingFeed(options, (run) =>
    options.subscribe({
      context: run.context,
      signal: run.signal,
      onData: run.receive,
      onOpen: run.ready,
      onError: run.fail,
    }),
  );

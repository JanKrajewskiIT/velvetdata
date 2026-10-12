import type { TradingViewChartPoint } from '../charts/tradingTypes';
import { createTradingFeed } from './createTradingFeed';
import type { TradingViewFeed, TradingViewFeedContext, TradingViewFeedOptions } from './tradingFeedTypes';
import { DEFAULT_TRADING_POLL_INTERVAL_MS } from './tradingFeedTypes';

export interface TradingViewPollingFeedOptions extends TradingViewFeedOptions {
  readonly intervalMs?: number;
  readonly poll: (context: TradingViewFeedContext, signal: AbortSignal) => Promise<readonly TradingViewChartPoint[]>;
}

export const useTradingViewPollingFeed = (options: TradingViewPollingFeedOptions): TradingViewFeed => {
  const intervalMs = options.intervalMs ?? DEFAULT_TRADING_POLL_INTERVAL_MS;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0 || intervalMs > 2_147_483_647)
    throw new RangeError('intervalMs must be within the positive browser timer range.');
  return createTradingFeed(options, (run) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      let points: readonly TradingViewChartPoint[];
      try {
        points = await options.poll(run.context, run.signal);
      } catch (cause) {
        run.fail(cause);
        return;
      }
      if (run.signal.aborted) return;
      if (!run.receive(points)) return;
      timer = setTimeout(() => {
        void poll();
      }, intervalMs);
    };
    void poll();
    return () => clearTimeout(timer);
  });
};

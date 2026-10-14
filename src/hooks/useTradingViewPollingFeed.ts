import type { TradingViewChartPoint } from '../charts/tradingTypes';
import { createTradingFeed } from './createTradingFeed';
import { pollWithDeadline } from './pollWithDeadline';
import type { TradingViewFeed, TradingViewFeedContext, TradingViewFeedOptions } from './tradingFeedTypes';
import { DEFAULT_TRADING_POLL_INTERVAL_MS, DEFAULT_TRADING_POLL_TIMEOUT_MS } from './tradingFeedTypes';
import { createTradingRetry, type TradingRetryOptions } from './tradingRetry';

export interface TradingViewPollingFeedOptions extends TradingViewFeedOptions {
  readonly intervalMs?: number;
  /** Request deadline; 0 disables it. @default 30000 */
  readonly timeoutMs?: number;
  readonly retry?: TradingRetryOptions;
  readonly poll: (context: TradingViewFeedContext, signal: AbortSignal) => Promise<readonly TradingViewChartPoint[]>;
}

export const useTradingViewPollingFeed = (options: TradingViewPollingFeedOptions): TradingViewFeed => {
  const intervalMs = options.intervalMs ?? DEFAULT_TRADING_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TRADING_POLL_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || timeoutMs > 2_147_483_647)
    throw new RangeError('timeoutMs must be within the non-negative browser timer range.');
  if (!Number.isFinite(intervalMs) || intervalMs <= 0 || intervalMs > 2_147_483_647)
    throw new RangeError('intervalMs must be within the positive browser timer range.');
  return createTradingFeed(options, (run) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const recovery = createTradingRetry(run, options.retry, () => {
      void poll().catch(recovery.fail);
    });
    const poll = async () => {
      let points: readonly TradingViewChartPoint[];
      try {
        points = await pollWithDeadline(options.poll, run.context, run.signal, timeoutMs);
      } catch (cause) {
        recovery.fail(cause);
        return;
      }
      if (run.signal.aborted) return;
      if (!run.receive(points)) return;
      recovery.reset();
      timer = setTimeout(() => {
        void poll().catch(recovery.fail);
      }, intervalMs);
    };
    void poll().catch(recovery.fail);
    return () => {
      clearTimeout(timer);
      recovery.dispose();
    };
  });
};

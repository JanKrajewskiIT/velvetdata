import { reportAsyncError } from '@jankrajewskiit/ui/common';

import type { TradingFeedRun } from './createTradingFeed';

export interface TradingRetryOptions {
  /** Maximum retries after consecutive failures. @default 3 */
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly maxDelayMs?: number;
  readonly shouldRetry?: (cause: unknown) => boolean;
}

export const DEFAULT_TRADING_RETRY_OPTIONS = Object.freeze({ maxAttempts: 3, delayMs: 1000, maxDelayMs: 30_000 });

export const createTradingRetry = (
  run: TradingFeedRun,
  options: TradingRetryOptions | undefined,
  retry: () => void,
) => {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_TRADING_RETRY_OPTIONS.maxAttempts;
  const delayMs = options?.delayMs ?? DEFAULT_TRADING_RETRY_OPTIONS.delayMs;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_TRADING_RETRY_OPTIONS.maxDelayMs;
  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 0 ||
    !Number.isFinite(delayMs) ||
    delayMs <= 0 ||
    !Number.isFinite(maxDelayMs) ||
    maxDelayMs < delayMs ||
    maxDelayMs > 2_147_483_647
  )
    throw new RangeError(
      'Retry attempts must be nonnegative integers and delays must fit the positive browser timer range.',
    );
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  return {
    reset: () => {
      attempts = 0;
    },
    fail: (cause: unknown) => {
      if (disposed || run.signal.aborted) return;
      run.fail(cause);
      if (!options || attempts >= maxAttempts) return;
      try {
        if (options.shouldRetry?.(cause) === false) return;
      } catch (error) {
        reportAsyncError(error);
        return;
      }
      const delay = Math.min(maxDelayMs, delayMs * 2 ** attempts++);
      run.reconnecting();
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!disposed && !run.signal.aborted) retry();
      }, delay);
    },
    dispose: () => {
      disposed = true;
      clearTimeout(timer);
    },
  };
};

import type { TradingViewChartPoint } from '../charts/tradingTypes';
import type { TradingViewFeedContext } from './tradingFeedTypes';

export const pollWithDeadline = async (
  poll: (context: TradingViewFeedContext, signal: AbortSignal) => Promise<readonly TradingViewChartPoint[]>,
  context: TradingViewFeedContext,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<readonly TradingViewChartPoint[]> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectDeadline: ((cause: unknown) => void) | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    rejectDeadline = reject;
  });
  const abort = () => {
    controller.abort();
    rejectDeadline?.(new DOMException('Trading poll cancelled.', 'AbortError'));
  };
  signal.addEventListener('abort', abort, { once: true });
  try {
    if (signal.aborted) {
      abort();
      return await deadline;
    }
    if (timeoutMs > 0)
      timer = setTimeout(() => {
        controller.abort();
        rejectDeadline?.(new DOMException('Trading poll deadline exceeded.', 'TimeoutError'));
      }, timeoutMs);
    const work = Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new DOMException('Trading poll cancelled.', 'AbortError');
      return poll(context, controller.signal);
    });
    return await Promise.race([work, deadline]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
};

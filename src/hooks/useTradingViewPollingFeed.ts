import type {
  TradingViewChartPoint,
  TradingViewFeedContext,
  TradingViewLiveFeedConfig,
} from '../charts/TradingViewChart/TradingViewChart';

interface TradingViewPollingFeedOptions {
  mapData: (
    payload: unknown,
    context: TradingViewFeedContext,
  ) => TradingViewChartPoint | TradingViewChartPoint[] | null;
  url: string | ((context: TradingViewFeedContext) => string);
  enabled?: boolean;
  intervalMs?: number;
  fetcher?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  requestInit?: RequestInit | ((context: TradingViewFeedContext) => RequestInit | undefined);
  parseResponse?: (response: Response, context: TradingViewFeedContext) => Promise<unknown>;
}

const resolveValue = <T>(value: T | ((context: TradingViewFeedContext) => T), context: TradingViewFeedContext): T => {
  if (typeof value === 'function') return (value as (ctx: TradingViewFeedContext) => T)(context);
  return value;
};

const useTradingViewPollingFeed = (options: TradingViewPollingFeedOptions): TradingViewLiveFeedConfig => {
  const parseResponse =
    options.parseResponse ??
    (async (response: Response) => {
      if (!response.ok) return null;
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text) as unknown;
    });

  return {
    mode: 'polling',
    enabled: options.enabled ?? true,
    intervalMs: options.intervalMs,
    poll: async (context) => {
      const fetcher = options.fetcher ?? globalThis.fetch;
      const url = resolveValue(options.url, context);
      const init = options.requestInit ? resolveValue(options.requestInit, context) : undefined;
      const payload = await fetcher(url, init).then((response) => parseResponse(response, context));
      return options.mapData(payload, context);
    },
  };
};

export type { TradingViewPollingFeedOptions };
export default useTradingViewPollingFeed;

import type { Accessor } from 'solid-js';

import type { TradingFeedStatus, TradingViewChartPoint } from '../charts/tradingTypes';

export interface TradingViewFeedContext {
  readonly symbol: string;
  readonly interval: string;
}

export interface TradingViewFeedOptions {
  readonly context: Accessor<TradingViewFeedContext>;
  readonly enabled?: Accessor<boolean>;
  readonly initialData?: (context: TradingViewFeedContext) => readonly TradingViewChartPoint[];
  readonly maxPoints?: number;
}

export interface TradingViewFeed {
  readonly data: Accessor<readonly TradingViewChartPoint[]>;
  readonly status: Accessor<TradingFeedStatus>;
  readonly error: Accessor<Error | undefined>;
  readonly restart: () => void;
}

export const DEFAULT_TRADING_MAX_POINTS = 5000;
export const DEFAULT_TRADING_POLL_INTERVAL_MS = 5000;

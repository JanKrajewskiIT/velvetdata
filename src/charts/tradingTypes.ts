import type { JSX } from 'solid-js';

export interface TradingViewChartPoint {
  /** Unix timestamp in seconds, UTC. */
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export const TRADING_INDICATOR_KINDS = ['sma', 'ema'] as const;
export type TradingIndicatorKind = (typeof TRADING_INDICATOR_KINDS)[number];

export interface TradingIndicator {
  readonly id: string;
  readonly kind: TradingIndicatorKind;
  readonly period: number;
}

export interface TradingIndicatorPoint {
  readonly time: number;
  readonly value: number;
}

export interface TradingIndicatorSeries extends TradingIndicator {
  readonly points: readonly TradingIndicatorPoint[];
}

export interface TradingPriceLevel {
  readonly id: string;
  readonly price: number;
  readonly label: string;
}

export interface TradingChartSnapshot {
  readonly data: readonly TradingViewChartPoint[];
  readonly indicators: readonly TradingIndicatorSeries[];
  readonly levels: readonly TradingPriceLevel[];
  readonly volume: boolean;
  readonly locale: string;
}

export interface TradingChartEngine {
  readonly update: (snapshot: TradingChartSnapshot) => void;
  readonly fitContent: () => void;
  readonly zoom: (factor: number) => void;
  readonly pan: (fraction: number) => void;
  readonly dispose: () => void;
}

export interface TradingChartEngineOptions {
  readonly element: HTMLDivElement;
  readonly onPointChange: (point: TradingViewChartPoint | undefined) => void;
  readonly onError: (error: Error) => void;
}

export type TradingChartEngineFactory = (options: TradingChartEngineOptions) => TradingChartEngine;

export const TRADING_FEED_STATUSES = ['idle', 'pending', 'live', 'error'] as const;
export type TradingFeedStatus = (typeof TRADING_FEED_STATUSES)[number];

export interface TradingViewChartProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  'children' | 'onError' | 'onVolumeChange'
> {
  readonly symbol: string;
  readonly data: readonly TradingViewChartPoint[];
  readonly createEngine: TradingChartEngineFactory;
  readonly height?: number;
  readonly locale?: string;
  readonly interval?: string;
  readonly intervals?: readonly { value: string; label: string }[];
  readonly onIntervalChange?: (interval: string) => void;
  readonly indicators?: readonly TradingIndicator[];
  readonly defaultIndicators?: readonly TradingIndicator[];
  readonly onIndicatorsChange?: (indicators: readonly TradingIndicator[]) => void;
  readonly volume?: boolean;
  readonly defaultVolume?: boolean;
  readonly onVolumeChange?: (volume: boolean) => void;
  readonly levels?: readonly TradingPriceLevel[];
  readonly status?: TradingFeedStatus;
  readonly onRetry?: () => void;
  readonly onError?: (error: Error) => void;
}

export const DEFAULT_TRADING_HEIGHT = 420;
export const DEFAULT_TRADING_INDICATORS: readonly TradingIndicator[] = Object.freeze([
  Object.freeze({ id: 'sma20', kind: 'sma', period: 20 }),
  Object.freeze({ id: 'ema50', kind: 'ema', period: 50 }),
]);

import type { DivCoreNativeProps } from '@jankrajewskiit/ui';
import type { UTCTimestamp } from 'lightweight-charts';

export interface TradingViewChartPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingViewDrawPoint {
  time: UTCTimestamp;
  price: number;
}

export interface TradingViewTrendLine {
  id: string;
  from: TradingViewDrawPoint;
  to: TradingViewDrawPoint;
  color?: string;
}

export interface TradingViewLevelLine {
  id: string;
  price: number;
  color?: string;
}

export interface TradingViewZone {
  id: string;
  fromTime: UTCTimestamp;
  toTime: UTCTimestamp;
  low: number;
  high: number;
  color?: string;
}

export interface TradingViewDrawings {
  trendLines: TradingViewTrendLine[];
  levels: TradingViewLevelLine[];
  zones: TradingViewZone[];
}

export type TradingViewDrawingTool = 'none' | 'trendline' | 'level' | 'zone';
export type TradingViewLiveFeedMode = 'polling' | 'websocket';

export interface TradingViewFeedContext {
  symbol: string;
  interval: string;
  lastBar?: TradingViewChartPoint;
}

interface TradingViewPollingFeedConfig {
  mode: 'polling';
  enabled?: boolean;
  intervalMs?: number;
  poll: (
    context: TradingViewFeedContext,
  ) =>
    | TradingViewChartPoint
    | TradingViewChartPoint[]
    | null
    | Promise<TradingViewChartPoint | TradingViewChartPoint[] | null>;
}

interface TradingViewWebSocketFeedConfig {
  mode: 'websocket';
  enabled?: boolean;
  subscribe: (
    emit: (bars: TradingViewChartPoint | TradingViewChartPoint[]) => void,
    context: TradingViewFeedContext,
  ) => (() => void) | undefined;
}

export type TradingViewLiveFeedConfig = TradingViewPollingFeedConfig | TradingViewWebSocketFeedConfig;

export interface TradingViewChartProps extends DivCoreNativeProps {
  symbol?: string;
  data?: TradingViewChartPoint[];
  height?: number;
  locale?: string;
  intervalOptions?: string[];
  defaultInterval?: string;
  maxPoints?: number;
  liveFeed?: TradingViewLiveFeedConfig;
  drawings?: Partial<TradingViewDrawings>;
  defaultDrawingTool?: TradingViewDrawingTool;
  onDrawingsChange?: (drawings: TradingViewDrawings) => void;
}

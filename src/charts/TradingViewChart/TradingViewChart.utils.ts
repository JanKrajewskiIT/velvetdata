import type { Time, UTCTimestamp } from 'lightweight-charts';

import type { TradingViewChartPoint } from './TradingViewChart.types';

export const DEFAULT_HEIGHT = 520;
export const DEFAULT_POINTS = 240;
export const DEFAULT_LOCALE = 'en-US';
export const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

const INTERVAL_SECONDS: Record<string, number> = {
  '1m': 60,
  '5m': 5 * 60,
  '15m': 15 * 60,
  '1h': 60 * 60,
  '4h': 4 * 60 * 60,
  '1d': 24 * 60 * 60,
};

export const intervalToSeconds = (interval: string) => INTERVAL_SECONDS[interval] ?? 60 * 60;

export const getDrawingId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

export const generateDemoData = (interval: string, size = DEFAULT_POINTS): TradingViewChartPoint[] => {
  const step = intervalToSeconds(interval);
  const end = Math.floor(Date.now() / 1000);
  const start = end - step * size;
  let previousClose = 2890;

  return Array.from({ length: size }, (_, index) => {
    const time = (start + index * step) as UTCTimestamp;
    const trend = Math.sin(index / 13) * 8 + Math.cos(index / 34) * 5;
    const drift = Math.sin(index / 71) * 3.5;
    const open = previousClose;
    const close = Math.max(1, open + trend * 0.18 + drift * 0.12);
    const high = Math.max(open, close) + Math.abs(Math.sin(index / 7)) * 4.2 + 0.4;
    const low = Math.min(open, close) - Math.abs(Math.cos(index / 9)) * 4.1 - 0.4;
    const volume = 1200 + Math.abs(close - open) * 550 + Math.abs(Math.sin(index / 5)) * 900;
    previousClose = close;

    return {
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(0)),
    };
  });
};

export const createSimpleMovingAverage = (data: TradingViewChartPoint[], period: number) =>
  data.map((entry, index) => {
    const start = Math.max(0, index - period + 1);
    const window = data.slice(start, index + 1);
    const average = window.reduce((sum, item) => sum + item.close, 0) / Math.max(window.length, 1);
    return { time: entry.time, value: Number(average.toFixed(2)) };
  });

export const createExponentialMovingAverage = (data: TradingViewChartPoint[], period: number) => {
  const multiplier = 2 / (period + 1);
  let previousEma = data[0]?.close ?? 0;
  return data.map((entry, index) => {
    if (index === 0) {
      previousEma = entry.close;
      return { time: entry.time, value: Number(previousEma.toFixed(2)) };
    }
    previousEma = entry.close * multiplier + previousEma * (1 - multiplier);
    return { time: entry.time, value: Number(previousEma.toFixed(2)) };
  });
};

export const createRsi = (data: TradingViewChartPoint[], period: number) => {
  if (data.length === 0) return [];
  const result: Array<{ time: UTCTimestamp; value: number }> = [];
  const first = data[0];
  if (!first) return result;
  let averageGain = 0;
  let averageLoss = 0;
  for (let i = 1; i <= period && i < data.length; i += 1) {
    const current = data[i];
    const previous = data[i - 1];
    if (!current || !previous) continue;
    const diff = current.close - previous.close;
    if (diff >= 0) averageGain += diff;
    else averageLoss += Math.abs(diff);
  }
  averageGain /= period;
  averageLoss /= period;
  result.push({ time: first.time, value: 50 });
  for (let i = 1; i < data.length; i += 1) {
    const current = data[i];
    const previous = data[i - 1];
    if (!current || !previous) continue;
    const diff = current.close - previous.close;
    const gain = Math.max(diff, 0);
    const loss = Math.max(-diff, 0);
    if (i <= period) {
      const rs = averageLoss === 0 ? 100 : averageGain / averageLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push({ time: current.time, value: Number(rsi.toFixed(2)) });
      continue;
    }
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;
    const rs = averageLoss === 0 ? 100 : averageGain / averageLoss;
    const rsi = 100 - 100 / (1 + rs);
    result.push({ time: current.time, value: Number(rsi.toFixed(2)) });
  }
  return result;
};

export const createMacd = (data: TradingViewChartPoint[]) => {
  const fast = createExponentialMovingAverage(data, 12);
  const slow = createExponentialMovingAverage(data, 26);
  const macdLine = data.map((item, index) => {
    const value = (fast[index]?.value ?? 0) - (slow[index]?.value ?? 0);
    return { time: item.time, value: Number(value.toFixed(4)) };
  });
  const signalInput = macdLine.map((item) => ({ ...item, close: item.value }));
  const signalLine = createExponentialMovingAverage(
    signalInput.map((item) => ({
      time: item.time,
      open: item.close,
      high: item.close,
      low: item.close,
      close: item.close,
      volume: 0,
    })),
    9,
  );
  const histogram = macdLine.map((item, index) => {
    const signal = signalLine[index]?.value ?? 0;
    const value = Number((item.value - signal).toFixed(4));
    return { time: item.time, value };
  });
  return { macdLine, signalLine, histogram };
};

export const createBollingerBands = (data: TradingViewChartPoint[], period: number, multiplier: number) => {
  const basis = createSimpleMovingAverage(data, period);
  const upper = data.map((item, index) => {
    const start = Math.max(0, index - period + 1);
    const window = data.slice(start, index + 1).map((entry) => entry.close);
    const mean = basis[index]?.value ?? item.close;
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(window.length, 1);
    const standardDeviation = Math.sqrt(variance);
    return { time: item.time, value: Number((mean + standardDeviation * multiplier).toFixed(2)) };
  });
  const lower = data.map((item, index) => {
    const start = Math.max(0, index - period + 1);
    const window = data.slice(start, index + 1).map((entry) => entry.close);
    const mean = basis[index]?.value ?? item.close;
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(window.length, 1);
    const standardDeviation = Math.sqrt(variance);
    return { time: item.time, value: Number((mean - standardDeviation * multiplier).toFixed(2)) };
  });
  return { basis, upper, lower };
};

export const timeKey = (time: Time) =>
  typeof time === 'object' ? `${time.year}-${time.month}-${time.day}` : String(time);

export const isBusinessDay = (value: unknown): value is { year: number; month: number; day: number } =>
  typeof value === 'object' && value !== null && 'year' in value && 'month' in value && 'day' in value;

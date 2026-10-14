import type { TradingViewChartPoint } from './tradingTypes';

const validateTradingPoint = (point: TradingViewChartPoint): void => {
  if (!Number.isSafeInteger(point.time) || point.time < 0 || point.time > 8_640_000_000_000)
    throw new RangeError('Trading point time must be a nonnegative Unix timestamp in seconds.');
  if (![point.open, point.high, point.low, point.close, point.volume].every(Number.isFinite))
    throw new RangeError('Trading point prices and volume must be finite.');
  if (
    point.low > Math.min(point.open, point.close) ||
    point.high < Math.max(point.open, point.close) ||
    point.volume < 0
  )
    throw new RangeError('Trading point must contain consistent OHLC prices and nonnegative volume.');
};

export const validateTradingData = (data: readonly TradingViewChartPoint[]): void => {
  let previous = -1;
  for (const point of data) {
    validateTradingPoint(point);
    if (point.time <= previous) throw new RangeError('Trading points must have unique, ascending timestamps.');
    previous = point.time;
  }
};

export const mergeTradingPoints = (
  current: readonly TradingViewChartPoint[],
  incoming: readonly TradingViewChartPoint[],
  maxPoints: number,
): readonly TradingViewChartPoint[] => {
  if (!Number.isSafeInteger(maxPoints) || maxPoints <= 0) throw new RangeError('maxPoints must be a positive integer.');
  validateTradingData(current);
  const points = new Map<number, TradingViewChartPoint>();
  for (const point of incoming) {
    validateTradingPoint(point);
    points.set(point.time, point);
  }
  const updates = [...points.values()].sort((a, b) => a.time - b.time);
  const merged: TradingViewChartPoint[] = [];
  let index = 0;
  let updateIndex = 0;
  while (index < current.length || updateIndex < updates.length) {
    const previous = current[index];
    const next = updates[updateIndex];
    if (previous && (!next || previous.time < next.time)) {
      merged.push(previous);
      index++;
    } else if (next) {
      merged.push(next);
      updateIndex++;
      if (previous?.time === next.time) index++;
    }
  }
  return merged.slice(-maxPoints);
};

export const firstTradingChange = (
  previous: readonly TradingViewChartPoint[],
  next: readonly TradingViewChartPoint[],
): number => {
  const count = Math.min(previous.length, next.length);
  for (let index = 0; index < count; index++) {
    const before = previous[index];
    const after = next[index];
    if (
      before?.time !== after?.time ||
      before?.open !== after?.open ||
      before?.high !== after?.high ||
      before?.low !== after?.low ||
      before?.close !== after?.close ||
      before?.volume !== after?.volume
    )
      return index;
  }
  return count;
};

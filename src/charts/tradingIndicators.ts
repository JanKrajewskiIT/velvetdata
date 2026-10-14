import type {
  TradingIndicator,
  TradingIndicatorPoint,
  TradingIndicatorSeries,
  TradingViewChartPoint,
} from './tradingTypes';
import { TRADING_INDICATOR_KINDS } from './tradingTypes';

export const calculateTradingIndicator = (
  data: readonly TradingViewChartPoint[],
  indicator: TradingIndicator,
  previous?: TradingIndicatorSeries,
  changedAt = 0,
): TradingIndicatorSeries => {
  if (!Number.isSafeInteger(indicator.period) || indicator.period <= 0)
    throw new RangeError('Indicator period must be a positive integer.');
  if (!TRADING_INDICATOR_KINDS.includes(indicator.kind))
    throw new RangeError(`Indicator kind must be one of: ${TRADING_INDICATOR_KINDS.join(', ')}.`);
  const compatible =
    previous?.id === indicator.id && previous.kind === indicator.kind && previous.period === indicator.period;
  const start = compatible ? Math.max(indicator.period - 1, changedAt) : indicator.period - 1;
  const points: TradingIndicatorPoint[] = compatible
    ? previous.points.slice(0, Math.max(0, start - indicator.period + 1))
    : [];
  let sum = data
    .slice(Math.max(0, start - indicator.period + 1), start + 1)
    .reduce((value, point) => value + point.close, 0);
  let average = points.at(-1)?.value ?? 0;
  const weight = 2 / (indicator.period + 1);
  for (let index = start; index < data.length; index++) {
    const point = data[index];
    if (!point) continue;
    if (index > start) {
      sum += point.close;
      sum -= data[index - indicator.period]?.close ?? 0;
    }
    switch (indicator.kind) {
      case 'sma':
        average = sum / indicator.period;
        break;
      case 'ema':
        average =
          index === indicator.period - 1 ? sum / indicator.period : point.close * weight + average * (1 - weight);
        break;
      default: {
        const unsupported: never = indicator.kind;
        throw new RangeError(`Unsupported indicator: ${String(unsupported)}`);
      }
    }
    points.push({ time: point.time, value: average });
  }
  return { ...indicator, points };
};

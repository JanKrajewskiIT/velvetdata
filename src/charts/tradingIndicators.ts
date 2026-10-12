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
): TradingIndicatorSeries => {
  if (!Number.isSafeInteger(indicator.period) || indicator.period <= 0)
    throw new RangeError('Indicator period must be a positive integer.');
  if (!TRADING_INDICATOR_KINDS.includes(indicator.kind))
    throw new RangeError(`Indicator kind must be one of: ${TRADING_INDICATOR_KINDS.join(', ')}.`);
  const points: TradingIndicatorPoint[] = [];
  let sum = 0;
  let average = 0;
  const weight = 2 / (indicator.period + 1);
  data.forEach((point, index) => {
    sum += point.close;
    const previous = data[index - indicator.period];
    if (previous) sum -= previous.close;
    if (index < indicator.period - 1) return;
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
  });
  return { ...indicator, points };
};

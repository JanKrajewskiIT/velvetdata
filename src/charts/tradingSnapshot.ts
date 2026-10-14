import { firstTradingChange, validateTradingData } from './tradingData';
import { calculateTradingIndicator } from './tradingIndicators';
import type { TradingChartSnapshot, TradingIndicator, TradingPriceLevel, TradingViewChartPoint } from './tradingTypes';

export const createTradingSnapshot = (
  data: readonly TradingViewChartPoint[],
  indicators: readonly TradingIndicator[],
  levels: readonly TradingPriceLevel[],
  volume: boolean,
  locale: string,
  previous?: TradingChartSnapshot,
): TradingChartSnapshot => {
  validateTradingData(data);
  const ids = new Set<string>();
  const changedAt = previous ? firstTradingChange(previous.data, data) : 0;
  const previousIndicators = new Map(previous?.indicators.map((indicator) => [indicator.id, indicator]));
  const series = indicators.map((indicator) => {
    if (!indicator.id || ids.has(indicator.id)) throw new RangeError('Indicator IDs must be nonempty and unique.');
    ids.add(indicator.id);
    return calculateTradingIndicator(data, indicator, previousIndicators.get(indicator.id), changedAt);
  });
  ids.clear();
  for (const level of levels) {
    if (!level.id || ids.has(level.id) || !Number.isFinite(level.price))
      throw new RangeError('Price levels must have unique nonempty IDs and finite prices.');
    ids.add(level.id);
  }
  return { data, indicators: series, levels, volume, locale };
};

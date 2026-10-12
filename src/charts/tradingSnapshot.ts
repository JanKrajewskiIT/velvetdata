import { validateTradingData } from './tradingData';
import { calculateTradingIndicator } from './tradingIndicators';
import type { TradingChartSnapshot, TradingIndicator, TradingPriceLevel, TradingViewChartPoint } from './tradingTypes';

export const createTradingSnapshot = (
  data: readonly TradingViewChartPoint[],
  indicators: readonly TradingIndicator[],
  levels: readonly TradingPriceLevel[],
  volume: boolean,
  locale: string,
): TradingChartSnapshot => {
  validateTradingData(data);
  const ids = new Set<string>();
  const series = indicators.map((indicator) => {
    if (!indicator.id || ids.has(indicator.id)) throw new RangeError('Indicator IDs must be nonempty and unique.');
    ids.add(indicator.id);
    return calculateTradingIndicator(data, indicator);
  });
  ids.clear();
  for (const level of levels) {
    if (!level.id || ids.has(level.id) || !Number.isFinite(level.price))
      throw new RangeError('Price levels must have unique nonempty IDs and finite prices.');
    ids.add(level.id);
  }
  return { data, indicators: series, levels, volume, locale };
};

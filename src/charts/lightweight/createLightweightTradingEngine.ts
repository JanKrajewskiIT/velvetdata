import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IPriceLine,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';

import { firstTradingChange, validateTradingData } from '../tradingData';
import type { TradingChartEngineFactory, TradingChartSnapshot, TradingViewChartPoint } from '../tradingTypes';
import { readTradingPalette } from './tradingPalette';

export const createLightweightTradingEngine: TradingChartEngineFactory = (options) => {
  let palette = readTradingPalette(options.element);
  const chart = createChart(options.element, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: palette.background },
      textColor: palette.text,
      attributionLogo: true,
    },
    grid: { vertLines: { color: palette.border }, horzLines: { color: palette.border } },
    rightPriceScale: { borderColor: palette.border },
    timeScale: { borderColor: palette.border, timeVisible: true, secondsVisible: false },
  });
  const candles = chart.addSeries(CandlestickSeries, {
    upColor: palette.up,
    downColor: palette.down,
    wickUpColor: palette.up,
    wickDownColor: palette.down,
    borderVisible: false,
  });
  const volume = chart.addSeries(HistogramSeries, {
    priceScaleId: '',
    priceFormat: { type: 'volume' },
    priceLineVisible: false,
    lastValueVisible: false,
  });
  volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
  const lines = new Map<string, ISeriesApi<'Line'>>();
  let priceLines: IPriceLine[] = [];
  let data = new Map<number, TradingViewChartPoint>();
  let snapshot: TradingChartSnapshot | undefined;
  let fitted = false;
  let disposed = false;
  let pointFrame: number | undefined;
  let themeFrame: number | undefined;
  let nextPoint: TradingViewChartPoint | undefined;
  const emitPoint = (event: MouseEventParams<Time>) => {
    nextPoint = typeof event.time === 'number' ? data.get(event.time) : undefined;
    if (pointFrame !== undefined) return;
    pointFrame = requestAnimationFrame(() => {
      pointFrame = undefined;
      if (!disposed) options.onPointChange(nextPoint);
    });
  };
  chart.subscribeCrosshairMove(emitPoint);

  const updateSeries = (next: TradingChartSnapshot, previous?: TradingChartSnapshot) => {
    const changedAt = previous ? firstTradingChange(previous.data, next.data) : 0;
    const incremental = !!previous && next.data.length >= previous.data.length && changedAt >= previous.data.length - 1;
    if (incremental) {
      for (const point of next.data.slice(changedAt)) candles.update({ ...point, time: point.time as UTCTimestamp });
    } else candles.setData(next.data.map((point) => ({ ...point, time: point.time as UTCTimestamp })));
    volume.applyOptions({ visible: next.volume });
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: next.volume ? 0.25 : 0.1 } });
    const volumePoints = (incremental ? next.data.slice(changedAt) : next.data).map((point) => ({
      time: point.time as UTCTimestamp,
      value: point.volume,
      color: point.close >= point.open ? palette.up : palette.down,
    }));
    if (incremental) for (const point of volumePoints) volume.update(point);
    else volume.setData(volumePoints);
    const ids = new Set(next.indicators.map((indicator) => indicator.id));
    for (const [id, line] of lines) {
      if (ids.has(id)) continue;
      chart.removeSeries(line);
      lines.delete(id);
    }
    next.indicators.forEach((indicator, index) => {
      let line = lines.get(indicator.id);
      const color = palette.indicators[index % palette.indicators.length] ?? palette.text;
      if (!line) {
        line = chart.addSeries(LineSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
        lines.set(indicator.id, line);
      }
      line.applyOptions({ color });
      const before = previous?.indicators.find(
        (item) => item.id === indicator.id && item.kind === indicator.kind && item.period === indicator.period,
      );
      let from = 0;
      if (before) {
        const count = Math.min(before.points.length, indicator.points.length);
        while (
          from < count &&
          before.points[from]?.time === indicator.points[from]?.time &&
          before.points[from]?.value === indicator.points[from]?.value
        )
          from++;
      }
      const append = before && indicator.points.length >= before.points.length && from >= before.points.length - 1;
      const points = (append ? indicator.points.slice(from) : indicator.points).map((point) => ({
        time: point.time as UTCTimestamp,
        value: point.value,
      }));
      if (append) for (const point of points) line.update(point);
      else line.setData(points);
    });
    const sameLevels =
      previous &&
      previous.levels.length === next.levels.length &&
      next.levels.every((level, index) => {
        const previousLevel = previous.levels[index];
        return (
          previousLevel !== undefined &&
          level.id === previousLevel.id &&
          level.price === previousLevel.price &&
          level.label === previousLevel.label
        );
      });
    if (sameLevels) return;
    for (const line of priceLines) candles.removePriceLine(line);
    priceLines = next.levels.map((level) =>
      candles.createPriceLine({
        price: level.price,
        title: level.label,
        color: palette.text,
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        axisLabelVisible: true,
      }),
    );
  };
  const applyTheme = () => {
    themeFrame = undefined;
    if (disposed) return;
    palette = readTradingPalette(options.element);
    chart.applyOptions({
      layout: { background: { type: ColorType.Solid, color: palette.background }, textColor: palette.text },
      grid: { vertLines: { color: palette.border }, horzLines: { color: palette.border } },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border },
    });
    candles.applyOptions({
      upColor: palette.up,
      downColor: palette.down,
      wickUpColor: palette.up,
      wickDownColor: palette.down,
    });
    if (snapshot) updateSeries(snapshot);
  };
  const scheduleTheme = () => {
    if (themeFrame === undefined)
      themeFrame = requestAnimationFrame(() => {
        try {
          applyTheme();
        } catch (cause) {
          options.onError(cause instanceof Error ? cause : new Error('Chart theme update failed.', { cause }));
        }
      });
  };
  const observer = new MutationObserver(scheduleTheme);
  for (let node: HTMLElement | null = options.element; node; node = node.parentElement)
    observer.observe(node, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  const preference = matchMedia('(prefers-color-scheme: dark)');
  preference.addEventListener('change', scheduleTheme);

  const range = () => (disposed ? null : chart.timeScale().getVisibleLogicalRange());
  return {
    update: (next) => {
      if (disposed) return;
      validateTradingData(next.data);
      const previous = snapshot;
      data = new Map(next.data.map((point) => [point.time, point]));
      chart.applyOptions({ localization: { locale: next.locale } });
      try {
        updateSeries(next, previous);
      } catch (cause) {
        snapshot = undefined;
        throw cause;
      }
      snapshot = next;
      if (!fitted && next.data.length) {
        chart.timeScale().fitContent();
        fitted = true;
      }
    },
    fitContent: () => {
      if (!disposed) chart.timeScale().fitContent();
    },
    zoom: (factor) => {
      const current = range();
      if (!current || !Number.isFinite(factor) || factor <= 0) return;
      const center = (current.from + current.to) / 2;
      const half = Math.max(1, ((current.to - current.from) * factor) / 2);
      chart.timeScale().setVisibleLogicalRange({ from: center - half, to: center + half });
    },
    pan: (fraction) => {
      const current = range();
      if (!current || !Number.isFinite(fraction)) return;
      const delta = (current.to - current.from) * fraction;
      chart.timeScale().setVisibleLogicalRange({ from: current.from + delta, to: current.to + delta });
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      preference.removeEventListener('change', scheduleTheme);
      if (pointFrame !== undefined) cancelAnimationFrame(pointFrame);
      if (themeFrame !== undefined) cancelAnimationFrame(themeFrame);
      chart.unsubscribeCrosshairMove(emitPoint);
      chart.remove();
      lines.clear();
      data.clear();
      priceLines = [];
      snapshot = undefined;
    },
  };
};

import type { Props } from '@jankrajewskiit/ui';
import { classNames, useI18n } from '@jankrajewskiit/ui';
import {
  type CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  type HistogramData,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import type { JSX } from 'solid-js';
import { batch, createEffect, createMemo, createSignal, on, onCleanup, onMount, splitProps, untrack } from 'solid-js';


import styles from './TradingViewChart.module.css';
import type {
  TradingViewChartPoint,
  TradingViewChartProps,
  TradingViewDrawingTool,
  TradingViewDrawPoint,
  TradingViewFeedContext,
  TradingViewLevelLine,
  TradingViewTrendLine,
  TradingViewZone,
} from './TradingViewChart.types';
import {
  createBollingerBands,
  createExponentialMovingAverage,
  createMacd,
  createRsi,
  createSimpleMovingAverage,
  DEFAULT_HEIGHT,
  DEFAULT_POINTS,
  generateDemoData,
  getDrawingId,
  INTERVALS,
  intervalToSeconds,
  isBusinessDay,
  timeKey,
} from './TradingViewChart.utils';
import TradingViewChartMetrics from './TradingViewChartMetrics';
import TradingViewChartOverlay from './TradingViewChartOverlay';
import TradingViewChartToolbar, { type TradingViewChartToolbarToggle } from './TradingViewChartToolbar';

interface ChartPalette {
  bg: string;
  border: string;
  text: string;
  mutedText: string;
  primary: string;
  success: string;
  error: string;
  info: string;
  warning: string;
}

const readToken = (element: HTMLElement, token: string) =>
  getComputedStyle(element).getPropertyValue(token).trim() || 'currentColor';

const resolvePalette = (element: HTMLElement): ChartPalette => ({
  bg: readToken(element, '--color-bg'),
  border: readToken(element, '--color-border'),
  text: readToken(element, '--color-text'),
  mutedText: readToken(element, '--color-text-muted'),
  primary: readToken(element, '--color-primary'),
  success: readToken(element, '--color-success'),
  error: readToken(element, '--color-error'),
  info: readToken(element, '--color-info'),
  warning: readToken(element, '--color-warning'),
});

const toFixed = (value: number, digits = 2) => value.toFixed(digits);
const getBarDirectionColor = (entry: TradingViewChartPoint, palette?: Pick<ChartPalette, 'success' | 'error'>) =>
  entry.close >= entry.open ? (palette?.success ?? 'currentColor') : (palette?.error ?? 'currentColor');

const isCandlestickData = (value: unknown): value is CandlestickData =>
  typeof value === 'object' &&
  value !== null &&
  'open' in value &&
  'high' in value &&
  'low' in value &&
  'close' in value &&
  'time' in value;

const TradingViewChart = (props: Props<TradingViewChartProps>) => {
  const { ts } = useI18n();
  const [local, rest] = splitProps(props, [
    'symbol',
    'data',
    'height',
    'locale',
    'intervalOptions',
    'defaultInterval',
    'class',
    'maxPoints',
    'liveFeed',
    'drawings',
    'defaultDrawingTool',
    'onDrawingsChange',
  ]);
  const [showVolume, setShowVolume] = createSignal(true);
  const [showSma, setShowSma] = createSignal(true);
  const [showEma, setShowEma] = createSignal(true);
  const [showRsi, setShowRsi] = createSignal(true);
  const [showMacd, setShowMacd] = createSignal(true);
  const [showBb, setShowBb] = createSignal(true);
  const [hoveredBar, setHoveredBar] = createSignal<TradingViewChartPoint | undefined>();
  const [runtimeData, setRuntimeData] = createSignal<TradingViewChartPoint[]>([]);
  const [activeInterval, setActiveInterval] = createSignal(local.defaultInterval ?? '1h');
  const [activeTool, setActiveTool] = createSignal<TradingViewDrawingTool>(local.defaultDrawingTool ?? 'none');
  const [draftPoint, setDraftPoint] = createSignal<TradingViewDrawPoint | undefined>();
  const [trendLines, setTrendLines] = createSignal<TradingViewTrendLine[]>([]);
  const [levels, setLevels] = createSignal<TradingViewLevelLine[]>([]);
  const [zones, setZones] = createSignal<TradingViewZone[]>([]);
  const [overlayRevision, setOverlayRevision] = createSignal(0);
  const [chartSize, setChartSize] = createSignal({ width: 0, height: 0 });

  const intervals = createMemo(() => local.intervalOptions ?? INTERVALS);
  const baseData = createMemo(() =>
    local.data?.length ? local.data : generateDemoData(activeInterval(), DEFAULT_POINTS),
  );
  const chartData = createMemo(() => runtimeData());
  const chartDataByTime = createMemo(() => new Map(chartData().map((item) => [String(item.time), item])));
  const resolvedLocale = createMemo(() => local.locale ?? Intl.DateTimeFormat().resolvedOptions().locale);
  const businessDayToTimestamp = createMemo(() => {
    const map = new Map<string, UTCTimestamp>();
    for (const item of chartData()) {
      const date = new Date(item.time * 1000);
      map.set(`${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`, item.time);
    }
    return map;
  });
  const currentBar = createMemo(() => hoveredBar() ?? chartData().at(-1));
  const chartHeight = createMemo(() => local.height ?? DEFAULT_HEIGHT);
  const smaData = createMemo(() => createSimpleMovingAverage(chartData(), 20));
  const emaData = createMemo(() => createExponentialMovingAverage(chartData(), 50));
  const rsiData = createMemo(() => createRsi(chartData(), 14));
  const macdData = createMemo(() => createMacd(chartData()));
  const bollingerData = createMemo(() => createBollingerBands(chartData(), 20, 2));
  interface IndicatorsAtTime {
    rsi?: number;
    macd?: number;
    signal?: number;
    bbUpper?: number;
    bbLower?: number;
  }
  const indicatorsByTime = createMemo(() => {
    const map = new Map<string, IndicatorsAtTime>();
    const ensure = (key: string): IndicatorsAtTime => {
      let entry = map.get(key);
      if (!entry) {
        entry = {};
        map.set(key, entry);
      }
      return entry;
    };
    for (const item of rsiData()) ensure(String(item.time)).rsi = item.value;
    const macd = macdData();
    for (const item of macd.macdLine) ensure(String(item.time)).macd = item.value;
    for (const item of macd.signalLine) ensure(String(item.time)).signal = item.value;
    const bb = bollingerData();
    for (const item of bb.upper) ensure(String(item.time)).bbUpper = item.value;
    for (const item of bb.lower) ensure(String(item.time)).bbLower = item.value;
    return map;
  });
  const indicatorSnapshot = createMemo(() => {
    const time = currentBar()?.time;
    if (!time) return undefined;
    return indicatorsByTime().get(String(time)) ?? {};
  });
  const chartSymbol = createMemo(() => local.symbol ?? 'XAUUSD');
  const draftPoints = createMemo(() => {
    const point = draftPoint();
    return point ? [point] : [];
  });
  const toggleIndicatorControls = createMemo<TradingViewChartToolbarToggle[]>(() => [
    {
      id: 'volume',
      label: ts('trading.volumeShort'),
      active: showVolume(),
      onClick: () => setShowVolume((value) => !value),
    },
    {
      id: 'sma',
      label: ts('trading.smaShort'),
      active: showSma(),
      onClick: () => setShowSma((value) => !value),
    },
    {
      id: 'ema',
      label: ts('trading.emaShort'),
      active: showEma(),
      onClick: () => setShowEma((value) => !value),
    },
    {
      id: 'bb',
      label: ts('trading.bbShort'),
      active: showBb(),
      onClick: () => setShowBb((value) => !value),
    },
    {
      id: 'rsi',
      label: ts('trading.rsiShort'),
      active: showRsi(),
      onClick: () => setShowRsi((value) => !value),
    },
    {
      id: 'macd',
      label: ts('trading.macdShort'),
      active: showMacd(),
      onClick: () => setShowMacd((value) => !value),
    },
  ]);
  const drawingControls = createMemo<TradingViewChartToolbarToggle[]>(() => [
    {
      id: 'trendline',
      label: ts('trading.trendTool'),
      active: activeTool() === 'trendline',
      onClick: () => setActiveTool((tool) => (tool === 'trendline' ? 'none' : 'trendline')),
    },
    {
      id: 'level',
      label: ts('trading.levelTool'),
      active: activeTool() === 'level',
      onClick: () => setActiveTool((tool) => (tool === 'level' ? 'none' : 'level')),
    },
    {
      id: 'zone',
      label: ts('trading.zoneTool'),
      active: activeTool() === 'zone',
      onClick: () => setActiveTool((tool) => (tool === 'zone' ? 'none' : 'zone')),
    },
  ]);
  const metricItems = createMemo(() => {
    const bar = currentBar();
    const indicators = indicatorSnapshot();
    return [
      `O: ${toFixed(bar?.open ?? 0)}`,
      `H: ${toFixed(bar?.high ?? 0)}`,
      `L: ${toFixed(bar?.low ?? 0)}`,
      `C: ${toFixed(bar?.close ?? 0)}`,
      `V: ${toFixed(bar?.volume ?? 0, 0)}`,
      `RSI: ${toFixed(indicators?.rsi ?? 0)}`,
      `MACD: ${toFixed(indicators?.macd ?? 0, 4)}`,
      `SIG: ${toFixed(indicators?.signal ?? 0, 4)}`,
      `BB↑: ${toFixed(indicators?.bbUpper ?? 0)}`,
      `BB↓: ${toFixed(indicators?.bbLower ?? 0)}`,
    ] as const;
  });
  const displayMetricItems = createMemo(() => {
    const [open, high, low, close, volume, rsi, macd, signal] = metricItems();
    const indicators = indicatorSnapshot();

    return [
      open,
      high,
      low,
      close,
      volume,
      rsi,
      macd,
      signal,
      `BB Up: ${toFixed(indicators?.bbUpper ?? 0)}`,
      `BB Low: ${toFixed(indicators?.bbLower ?? 0)}`,
    ];
  });
  const clearLabel = () => ts('common.clear');
  const bbUpperTitle = () => ts('trading.bbUpper');
  const bbBasisTitle = () => ts('trading.bbBasis');
  const bbLowerTitle = () => ts('trading.bbLower');
  const smaTitle = () => ts('trading.sma20');
  const emaTitle = () => ts('trading.ema50');
  const rsiTitle = () => ts('trading.rsi14');
  const macdTitle = () => ts('trading.macd');
  const macdSignalTitle = () => ts('trading.macdSignal');
  const macdHistTitle = () => ts('trading.macdHist');

  let wrapperRef: HTMLDivElement | undefined;
  let chartHostRef: HTMLDivElement | undefined;
  let overlayRef: SVGSVGElement | undefined;
  let chart: IChartApi | undefined;
  let candleSeries: ISeriesApi<'Candlestick'> | undefined;
  let volumeSeries: ISeriesApi<'Histogram'> | undefined;
  let smaSeries: ISeriesApi<'Line'> | undefined;
  let emaSeries: ISeriesApi<'Line'> | undefined;
  let bbUpperSeries: ISeriesApi<'Line'> | undefined;
  let bbBasisSeries: ISeriesApi<'Line'> | undefined;
  let bbLowerSeries: ISeriesApi<'Line'> | undefined;
  let rsiSeries: ISeriesApi<'Line'> | undefined;
  let macdSeries: ISeriesApi<'Line'> | undefined;
  let macdSignalSeries: ISeriesApi<'Line'> | undefined;
  let macdHistogramSeries: ISeriesApi<'Histogram'> | undefined;
  let rsiOverboughtLine: ReturnType<ISeriesApi<'Line'>['createPriceLine']> | undefined;
  let rsiOversoldLine: ReturnType<ISeriesApi<'Line'>['createPriceLine']> | undefined;
  let rsiMidLine: ReturnType<ISeriesApi<'Line'>['createPriceLine']> | undefined;
  let crosshairHandler: ((params: MouseEventParams) => void) | undefined;
  let themeObserver: MutationObserver | undefined;
  let timeRangeHandler: (() => void) | undefined;
  let sizeChangeHandler: (() => void) | undefined;
  let feedUnsubscribe: (() => void) | undefined;
  let feedTimer: ReturnType<typeof setInterval> | undefined;
  let latestDataByTime = new Map<string, TradingViewChartPoint>();
  let latestBar: TradingViewChartPoint | undefined;
  let skipFullRenderAtTime: UTCTimestamp | undefined;

  const applyChartTheme = () => {
    if (
      !wrapperRef ||
      !chart ||
      !candleSeries ||
      !smaSeries ||
      !emaSeries ||
      !volumeSeries ||
      !bbUpperSeries ||
      !bbBasisSeries ||
      !bbLowerSeries ||
      !rsiSeries ||
      !macdSeries ||
      !macdSignalSeries ||
      !macdHistogramSeries
    )
      return;
    const palette = resolvePalette(wrapperRef);

    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: palette.bg },
        textColor: palette.text,
      },
      grid: {
        vertLines: { color: palette.border },
        horzLines: { color: palette.border },
      },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border },
      crosshair: {
        mode: CrosshairMode.MagnetOHLC,
        vertLine: { color: palette.primary, width: 1, style: LineStyle.Dashed },
        horzLine: { color: palette.primary, width: 1, style: LineStyle.Dashed },
      },
    });

    candleSeries.applyOptions({
      upColor: palette.success,
      downColor: palette.error,
      borderVisible: false,
      wickUpColor: palette.success,
      wickDownColor: palette.error,
      lastValueVisible: true,
      priceLineVisible: true,
    });

    volumeSeries.applyOptions({
      color: palette.mutedText,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    smaSeries.applyOptions({ color: palette.primary, lineWidth: 2 });
    emaSeries.applyOptions({ color: palette.info, lineWidth: 2 });
    bbUpperSeries.applyOptions({ color: palette.warning, lineWidth: 1, lineStyle: LineStyle.Dotted });
    bbBasisSeries.applyOptions({ color: palette.primary, lineWidth: 1, lineStyle: LineStyle.Dashed });
    bbLowerSeries.applyOptions({ color: palette.warning, lineWidth: 1, lineStyle: LineStyle.Dotted });
    rsiSeries.applyOptions({ color: palette.info, lineWidth: 2 });
    macdSeries.applyOptions({ color: palette.primary, lineWidth: 2 });
    macdSignalSeries.applyOptions({ color: palette.warning, lineWidth: 2 });
    macdHistogramSeries.applyOptions({ color: palette.mutedText, priceLineVisible: false, lastValueVisible: false });
    rsiOverboughtLine?.applyOptions({ color: palette.warning });
    rsiOversoldLine?.applyOptions({ color: palette.warning });
    rsiMidLine?.applyOptions({ color: palette.border });
  };

  const renderSeriesData = () => {
    if (
      !candleSeries ||
      !volumeSeries ||
      !smaSeries ||
      !emaSeries ||
      !bbUpperSeries ||
      !bbBasisSeries ||
      !bbLowerSeries ||
      !rsiSeries ||
      !macdSeries ||
      !macdSignalSeries ||
      !macdHistogramSeries
    )
      return;
    const palette = wrapperRef ? resolvePalette(wrapperRef) : undefined;
    const sma = smaData();
    const ema = emaData();
    const rsi = rsiData();
    const macd = macdData();
    const bollinger = bollingerData();

    const candles: CandlestickData<UTCTimestamp>[] = chartData().map((entry) => ({
      time: entry.time,
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
    }));

    const histogram: HistogramData<UTCTimestamp>[] = chartData().map((entry) => ({
      time: entry.time,
      value: entry.volume,
      color: getBarDirectionColor(entry, palette),
    }));

    candleSeries.setData(candles);
    volumeSeries.setData(showVolume() ? histogram : []);
    smaSeries.setData(showSma() ? sma : []);
    emaSeries.setData(showEma() ? ema : []);
    bbUpperSeries.setData(showBb() ? bollinger.upper : []);
    bbBasisSeries.setData(showBb() ? bollinger.basis : []);
    bbLowerSeries.setData(showBb() ? bollinger.lower : []);
    rsiSeries.setData(showRsi() ? rsi : []);
    macdSeries.setData(showMacd() ? macd.macdLine : []);
    macdSignalSeries.setData(showMacd() ? macd.signalLine : []);
    macdHistogramSeries.setData(
      showMacd()
        ? macd.histogram.map((item) => ({
            time: item.time,
            value: item.value,
            color: item.value >= 0 ? (palette?.success ?? 'currentColor') : (palette?.error ?? 'currentColor'),
          }))
        : [],
    );
  };

  const updateSeriesIncrementally = (latestPoint: TradingViewChartPoint) => {
    if (
      !candleSeries ||
      !volumeSeries ||
      !smaSeries ||
      !emaSeries ||
      !bbUpperSeries ||
      !bbBasisSeries ||
      !bbLowerSeries ||
      !rsiSeries ||
      !macdSeries ||
      !macdSignalSeries ||
      !macdHistogramSeries
    )
      return false;

    const palette = wrapperRef ? resolvePalette(wrapperRef) : undefined;
    candleSeries.update({
      time: latestPoint.time,
      open: latestPoint.open,
      high: latestPoint.high,
      low: latestPoint.low,
      close: latestPoint.close,
    });

    if (showVolume()) {
      volumeSeries.update({
        time: latestPoint.time,
        value: latestPoint.volume,
        color: getBarDirectionColor(latestPoint, palette),
      });
    }

    const lastSma = smaData().at(-1);
    if (showSma() && lastSma) smaSeries.update(lastSma);

    const lastEma = emaData().at(-1);
    if (showEma() && lastEma) emaSeries.update(lastEma);

    const bollinger = bollingerData();
    const lastBbUpper = bollinger.upper.at(-1);
    const lastBbBasis = bollinger.basis.at(-1);
    const lastBbLower = bollinger.lower.at(-1);
    if (showBb() && lastBbUpper && lastBbBasis && lastBbLower) {
      bbUpperSeries.update(lastBbUpper);
      bbBasisSeries.update(lastBbBasis);
      bbLowerSeries.update(lastBbLower);
    }

    const lastRsi = rsiData().at(-1);
    if (showRsi() && lastRsi) rsiSeries.update(lastRsi);

    const macd = macdData();
    const lastMacd = macd.macdLine.at(-1);
    const lastMacdSignal = macd.signalLine.at(-1);
    const lastHistogram = macd.histogram.at(-1);
    if (showMacd() && lastMacd && lastMacdSignal && lastHistogram) {
      macdSeries.update(lastMacd);
      macdSignalSeries.update(lastMacdSignal);
      macdHistogramSeries.update({
        time: lastHistogram.time,
        value: lastHistogram.value,
        color: lastHistogram.value >= 0 ? (palette?.success ?? 'currentColor') : (palette?.error ?? 'currentColor'),
      });
    }

    return true;
  };

  const fitChart = (fitContent = true) => {
    if (!chart || !chartHostRef) return;
    const width = chartHostRef.clientWidth;
    const height = chartHeight();
    setChartSize({ width, height });
    chart.applyOptions({ width, height });
    if (fitContent) chart.timeScale().fitContent();
    setOverlayRevision((value) => value + 1);
  };

  const mergeBars = (current: TradingViewChartPoint[], incoming: TradingViewChartPoint[], maxPoints: number) => {
    const map = new Map(current.map((item) => [String(item.time), item]));
    for (const bar of incoming) map.set(String(bar.time), bar);
    const merged = Array.from(map.values()).sort((a, b) => a.time - b.time);
    return merged.slice(Math.max(0, merged.length - maxPoints));
  };

  const toTimestampFromTime = (time: Time | null): UTCTimestamp | null => {
    if (!time) return null;
    if (typeof time === 'number') return time;
    if (typeof time === 'string') {
      const parsed = Date.parse(time);
      if (Number.isNaN(parsed)) return null;
      return Math.floor(parsed / 1000) as UTCTimestamp;
    }
    if (!isBusinessDay(time)) return null;
    return businessDayToTimestamp().get(`${time.year}-${time.month}-${time.day}`) ?? null;
  };

  const coordinateToDrawPoint = (x: number, y: number): TradingViewDrawPoint | undefined => {
    if (!chart || !candleSeries) return undefined;
    const time = toTimestampFromTime(chart.timeScale().coordinateToTime(x));
    const price = candleSeries.coordinateToPrice(y);
    if (!time || price === null) return undefined;
    return { time, price };
  };

  const timeToX = (time: UTCTimestamp) => chart?.timeScale().timeToCoordinate(time) ?? null;
  const priceToY = (price: number) => candleSeries?.priceToCoordinate(price) ?? null;

  const projectedTrendLines = createMemo(() => {
    overlayRevision();
    return trendLines()
      .map((line) => {
        const x1 = timeToX(line.from.time);
        const y1 = priceToY(line.from.price);
        const x2 = timeToX(line.to.time);
        const y2 = priceToY(line.to.price);
        if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
        return { ...line, x1, y1, x2, y2 };
      })
      .filter(Boolean) as Array<TradingViewTrendLine & { x1: number; y1: number; x2: number; y2: number }>;
  });

  const projectedLevels = createMemo(() => {
    overlayRevision();
    const width = chartSize().width;
    return levels()
      .map((level) => {
        const y = priceToY(level.price);
        if (y === null) return null;
        return { ...level, y, x2: width };
      })
      .filter(Boolean) as Array<TradingViewLevelLine & { y: number; x2: number }>;
  });

  const projectedZones = createMemo(() => {
    overlayRevision();
    return zones()
      .map((zone) => {
        const x1 = timeToX(zone.fromTime);
        const x2 = timeToX(zone.toTime);
        const y1 = priceToY(zone.high);
        const y2 = priceToY(zone.low);
        if (x1 === null || x2 === null || y1 === null || y2 === null) return null;
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        return { ...zone, left, top, width, height };
      })
      .filter(Boolean) as Array<TradingViewZone & { left: number; top: number; width: number; height: number }>;
  });
  const projectedDraftPoints = createMemo(() => {
    overlayRevision();
    return draftPoints()
      .map((point) => {
        const x = timeToX(point.time);
        const y = priceToY(point.price);
        if (x === null || y === null) return null;
        return { ...point, x, y };
      })
      .filter(Boolean) as Array<TradingViewDrawPoint & { x: number; y: number }>;
  });

  const onDrawingsChange = () => {
    local.onDrawingsChange?.({
      trendLines: trendLines(),
      levels: levels(),
      zones: zones(),
    });
  };

  const clearCurrentTool = () => {
    const tool = activeTool();
    if (tool === 'trendline') setTrendLines([]);
    if (tool === 'level') setLevels([]);
    if (tool === 'zone') setZones([]);
    setDraftPoint(undefined);
    onDrawingsChange();
  };

  const handleOverlayPointerDown: JSX.EventHandlerUnion<SVGSVGElement, PointerEvent> = (event) => {
    if (!overlayRef) return;
    const tool = activeTool();
    if (tool === 'none') return;

    const rect = overlayRef.getBoundingClientRect();
    const point = coordinateToDrawPoint(event.clientX - rect.left, event.clientY - rect.top);
    if (!point) return;

    if (tool === 'level') {
      setLevels((prev) => [...prev, { id: getDrawingId('lvl'), price: point.price }]);
      setOverlayRevision((value) => value + 1);
      onDrawingsChange();
      return;
    }

    if (!draftPoint()) {
      setDraftPoint(point);
      return;
    }

    const start = draftPoint();
    if (!start) return;
    if (tool === 'trendline') {
      setTrendLines((prev) => [...prev, { id: getDrawingId('tl'), from: start, to: point }]);
    }
    if (tool === 'zone') {
      setZones((prev) => [
        ...prev,
        {
          id: getDrawingId('zn'),
          fromTime: Math.min(start.time, point.time) as UTCTimestamp,
          toTime: Math.max(start.time, point.time) as UTCTimestamp,
          high: Math.max(start.price, point.price),
          low: Math.min(start.price, point.price),
        },
      ]);
    }
    setDraftPoint(undefined);
    setOverlayRevision((value) => value + 1);
    onDrawingsChange();
  };

  onMount(() => {
    if (!chartHostRef || !wrapperRef) return;
    chart = createChart(chartHostRef, {
      width: chartHostRef.clientWidth,
      height: chartHeight(),
      autoSize: false,
      rightPriceScale: { scaleMargins: { top: 0.15, bottom: 0.22 } },
      timeScale: { timeVisible: true, secondsVisible: false, borderVisible: true },
      localization: { locale: resolvedLocale() },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    candleSeries = chart.addSeries(CandlestickSeries);
    volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
        lastValueVisible: false,
        priceLineVisible: false,
      },
      1,
    );
    bbUpperSeries = chart.addSeries(LineSeries, {
      title: bbUpperTitle(),
      priceLineVisible: false,
      lastValueVisible: false,
    });
    bbBasisSeries = chart.addSeries(LineSeries, {
      title: bbBasisTitle(),
      priceLineVisible: false,
      lastValueVisible: false,
    });
    bbLowerSeries = chart.addSeries(LineSeries, {
      title: bbLowerTitle(),
      priceLineVisible: false,
      lastValueVisible: false,
    });
    smaSeries = chart.addSeries(LineSeries, { title: smaTitle(), priceLineVisible: false, lastValueVisible: false });
    emaSeries = chart.addSeries(LineSeries, { title: emaTitle(), priceLineVisible: false, lastValueVisible: false });
    rsiSeries = chart.addSeries(LineSeries, { title: rsiTitle(), priceLineVisible: false, lastValueVisible: false }, 2);
    macdSeries = chart.addSeries(
      LineSeries,
      { title: macdTitle(), priceLineVisible: false, lastValueVisible: false },
      3,
    );
    macdSignalSeries = chart.addSeries(
      LineSeries,
      { title: macdSignalTitle(), priceLineVisible: false, lastValueVisible: false },
      3,
    );
    macdHistogramSeries = chart.addSeries(
      HistogramSeries,
      { title: macdHistTitle(), priceLineVisible: false, lastValueVisible: false },
      3,
    );
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
    rsiSeries.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0.15 } });
    macdSeries.priceScale().applyOptions({ scaleMargins: { top: 0.2, bottom: 0.2 } });
    macdSignalSeries.priceScale().applyOptions({ scaleMargins: { top: 0.2, bottom: 0.2 } });
    macdHistogramSeries.priceScale().applyOptions({ scaleMargins: { top: 0.2, bottom: 0.2 } });
    const palette = resolvePalette(wrapperRef);
    rsiOverboughtLine = rsiSeries.createPriceLine({
      price: 70,
      color: palette.warning,
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
    });
    rsiOversoldLine = rsiSeries.createPriceLine({
      price: 30,
      color: palette.warning,
      lineStyle: LineStyle.Dashed,
      lineWidth: 1,
    });
    rsiMidLine = rsiSeries.createPriceLine({
      price: 50,
      color: palette.border,
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
    });

    crosshairHandler = (params) => {
      if (!candleSeries) return;
      const data = params.seriesData.get(candleSeries);
      if (data && isCandlestickData(data)) {
        setHoveredBar(latestDataByTime.get(timeKey(data.time)));
        return;
      }
      setHoveredBar(undefined);
    };
    chart.subscribeCrosshairMove(crosshairHandler);
    timeRangeHandler = () => setOverlayRevision((value) => value + 1);
    sizeChangeHandler = () => setOverlayRevision((value) => value + 1);
    chart.timeScale().subscribeVisibleTimeRangeChange(timeRangeHandler);
    chart.timeScale().subscribeSizeChange(sizeChangeHandler);

    applyChartTheme();
    renderSeriesData();
    fitChart();

    const onResize = () => fitChart(false);
    window.addEventListener('resize', onResize);

    themeObserver = new MutationObserver(() => applyChartTheme());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    onCleanup(() => {
      window.removeEventListener('resize', onResize);
      if (themeObserver) themeObserver.disconnect();
      if (feedTimer) clearInterval(feedTimer);
      if (feedUnsubscribe) feedUnsubscribe();
      if (chart && crosshairHandler) chart.unsubscribeCrosshairMove(crosshairHandler);
      if (chart && timeRangeHandler) chart.timeScale().unsubscribeVisibleTimeRangeChange(timeRangeHandler);
      if (chart && sizeChangeHandler) chart.timeScale().unsubscribeSizeChange(sizeChangeHandler);
      if (chart) chart.remove();
      rsiOverboughtLine = undefined;
      rsiOversoldLine = undefined;
      rsiMidLine = undefined;
      chart = undefined;
    });
  });

  createEffect(
    on(
      baseData,
      (next) => {
        batch(() => {
          setRuntimeData(next);
          setHoveredBar(undefined);
        });
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    latestBar = runtimeData().at(-1);
  });

  createEffect(() => {
    latestDataByTime = chartDataByTime();
  });

  createEffect(
    on(
      () => local.drawings,
      (drawings) => {
        if (!drawings) return;
        batch(() => {
          setTrendLines(drawings.trendLines ?? []);
          setLevels(drawings.levels ?? []);
          setZones(drawings.zones ?? []);
          setOverlayRevision((value) => value + 1);
        });
      },
      { defer: true },
    ),
  );

  createEffect(
    on(
      activeTool,
      () => {
        setDraftPoint(undefined);
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    if (feedTimer) clearInterval(feedTimer);
    if (feedUnsubscribe) feedUnsubscribe();
    feedTimer = undefined;
    feedUnsubscribe = undefined;

    if (!local.liveFeed?.enabled) return;

    const context = (): TradingViewFeedContext => ({
      symbol: chartSymbol(),
      interval: activeInterval(),
      lastBar: latestBar,
    });
    const maxPoints = local.maxPoints ?? 800;
    const append = (payload: TradingViewChartPoint | TradingViewChartPoint[]) => {
      const incoming = Array.isArray(payload) ? payload : [payload];
      let latestIncoming: TradingViewChartPoint | undefined;
      for (const bar of incoming) {
        if (!latestIncoming || bar.time >= latestIncoming.time) latestIncoming = bar;
      }

      const current = untrack(runtimeData);
      const merged = mergeBars(current, incoming, maxPoints);
      const mergedTail = merged.at(-1);
      const canIncremental =
        incoming.length === 1 &&
        Boolean(mergedTail) &&
        Boolean(latestIncoming) &&
        mergedTail?.time === latestIncoming?.time &&
        (latestIncoming ? updateSeriesIncrementally(latestIncoming) : false);
      if (canIncremental && latestIncoming) {
        skipFullRenderAtTime = latestIncoming.time;
      }

      batch(() => {
        setRuntimeData(merged);
        setOverlayRevision((value) => value + 1);
      });
    };

    if (local.liveFeed.mode === 'polling' && local.liveFeed.poll) {
      const runPoll = async () => {
        const result = await local.liveFeed?.poll?.(context());
        if (!result) return;
        append(result);
      };
      void runPoll();
      feedTimer = setInterval(
        () => {
          void runPoll();
        },
        local.liveFeed.intervalMs ?? intervalToSeconds(activeInterval()) * 1000,
      );
    }

    if (local.liveFeed.mode === 'websocket' && local.liveFeed.subscribe) {
      const subscribe = local.liveFeed.subscribe;
      const handleFeedPayload = (payload: TradingViewChartPoint | TradingViewChartPoint[]) => {
        append(payload);
      };
      const initialContext: TradingViewFeedContext = {
        symbol: chartSymbol(),
        interval: activeInterval(),
        lastBar: latestBar,
      };
      const unsubscribe = subscribe(handleFeedPayload, initialContext);
      if (unsubscribe) feedUnsubscribe = unsubscribe;
    }
  });

  createEffect(
    on([showVolume, showSma, showEma, showRsi, showMacd, showBb, chartData] as const, ([, , , , , , data]) => {
      const latestTime = data.at(-1)?.time;
      if (latestTime && skipFullRenderAtTime === latestTime) {
        skipFullRenderAtTime = undefined;
        fitChart(false);
        return;
      }
      skipFullRenderAtTime = undefined;
      renderSeriesData();
      fitChart(false);
    }),
  );

  return (
    <div {...rest} ref={wrapperRef} class={classNames(styles.root, local.class)}>
      <TradingViewChartToolbar
        symbol={chartSymbol()}
        intervals={intervals()}
        activeInterval={activeInterval()}
        intervalSelectionDisabled={Boolean(local.data?.length)}
        onIntervalSelect={setActiveInterval}
        indicatorControls={toggleIndicatorControls()}
        drawingControls={drawingControls()}
        clearLabel={clearLabel()}
        onClear={clearCurrentTool}
      />

      <TradingViewChartMetrics items={displayMetricItems()} />

      <div class={styles.chartShell}>
        <div ref={chartHostRef} class={styles.chartHost} />
        <TradingViewChartOverlay
          overlayRef={(element) => {
            overlayRef = element;
          }}
          width={chartSize().width}
          height={chartSize().height}
          onPointerDown={handleOverlayPointerDown}
          zones={projectedZones()}
          trendLines={projectedTrendLines()}
          levels={projectedLevels()}
          draftPoints={projectedDraftPoints()}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
export type {
  TradingViewChartPoint,
  TradingViewChartProps,
  TradingViewDrawings,
  TradingViewDrawingTool,
  TradingViewFeedContext,
  TradingViewLevelLine,
  TradingViewLiveFeedConfig,
  TradingViewLiveFeedMode,
  TradingViewTrendLine,
  TradingViewZone,
} from './TradingViewChart.types';

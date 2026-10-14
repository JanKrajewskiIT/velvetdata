import { useI18n } from '@jankrajewskiit/i18n';
import { Badge, Button, EmptyState } from '@jankrajewskiit/ui/bare';
import { createControllable, cx } from '@jankrajewskiit/ui/common';
import { createEffect, createMemo, createSignal, mergeProps, on, onCleanup, onMount, Show, splitProps } from 'solid-js';

import { useTranslate } from '../i18n/useTranslate';
import { createTradingSnapshot } from './tradingSnapshot';
import type {
  TradingChartEngine,
  TradingChartSnapshot,
  TradingViewChartPoint,
  TradingViewChartProps,
} from './tradingTypes';
import { DEFAULT_TRADING_HEIGHT, DEFAULT_TRADING_INDICATORS } from './tradingTypes';
import styles from './TradingViewChart.module.css';
import { TradingViewChartData } from './TradingViewChartData';
import { TradingViewChartMetrics } from './TradingViewChartMetrics';
import { TradingViewChartToolbar } from './TradingViewChartToolbar';

const STATUS_KEYS = {
  idle: 'velvetData.trading.status.idle',
  pending: 'velvetData.trading.status.pending',
  live: 'velvetData.trading.status.live',
  error: 'velvetData.trading.status.error',
  reconnecting: 'velvetData.trading.status.reconnecting',
} as const;

export const TradingViewChart = (props: TradingViewChartProps) => {
  const p = mergeProps(
    {
      height: DEFAULT_TRADING_HEIGHT,
      status: 'idle',
      defaultVolume: true,
      levels: [],
    } satisfies Partial<TradingViewChartProps>,
    props,
  );
  const [local, rest] = splitProps(p, [
    'symbol',
    'data',
    'createEngine',
    'height',
    'locale',
    'interval',
    'intervals',
    'onIntervalChange',
    'indicators',
    'defaultIndicators',
    'onIndicatorsChange',
    'volume',
    'defaultVolume',
    'onVolumeChange',
    'levels',
    'status',
    'onRetry',
    'onError',
    'stale',
    'class',
    'style',
  ]);
  const translate = useTranslate();
  const i18n = useI18n();
  const [engine, setEngine] = createSignal<TradingChartEngine>();
  const [hovered, setHovered] = createSignal<TradingViewChartPoint>();
  const [error, setError] = createSignal<Error>();
  const [revision, setRevision] = createSignal(0);
  let element: HTMLDivElement | undefined;
  let errorRevision = 0;
  const [indicators, setIndicators] = createControllable({
    value: () => local.indicators,
    defaultValue: local.defaultIndicators ?? DEFAULT_TRADING_INDICATORS,
    onChange: (value) => local.onIndicatorsChange?.(value),
  });
  const [volume, setVolume] = createControllable({
    value: () => local.volume,
    defaultValue: local.defaultVolume,
    onChange: (value) => local.onVolumeChange?.(value),
  });
  const availableIndicators = createMemo(() => {
    const options = new Map(DEFAULT_TRADING_INDICATORS.map((indicator) => [indicator.id, indicator]));
    for (const indicator of [...(local.defaultIndicators ?? []), ...indicators()]) options.set(indicator.id, indicator);
    return [...options.values()];
  });
  const snapshot = createMemo<{ value: TradingChartSnapshot | undefined; error: Error | undefined }>((previous) => {
    try {
      const value = createTradingSnapshot(
        local.data,
        indicators(),
        local.levels,
        volume(),
        local.locale ?? i18n.locale(),
        previous?.value,
      );
      return { value, error: undefined };
    } catch (cause) {
      return {
        value: undefined,
        error: cause instanceof Error ? cause : new Error('Chart data is invalid.', { cause }),
      };
    }
  });
  const selectedPoint = () => {
    const point = hovered();
    return local.data.find((candidate) => candidate.time === point?.time) ?? local.data.at(-1);
  };
  const failed = () => !!error() || !!snapshot().error || local.status === 'error';
  const reportError = (cause: unknown) => {
    errorRevision++;
    const failure = cause instanceof Error ? cause : new Error('Chart rendering failed.', { cause });
    setError(failure);
    local.onError?.(failure);
  };
  createEffect(() => {
    const failure = snapshot().error;
    if (failure) local.onError?.(failure);
  });
  onMount(() => {
    createEffect(
      on(
        () => [revision(), local.symbol, local.interval, local.createEngine] as const,
        ([, , , createEngine]) => {
          if (!element) return;
          setError(undefined);
          let next: TradingChartEngine | undefined;
          let live = true;
          onCleanup(() => {
            live = false;
            setEngine(undefined);
            setHovered(undefined);
            next?.dispose();
          });
          try {
            next = createEngine({
              element,
              onPointChange: (point) => {
                if (live) setHovered(point);
              },
              onError: (cause) => {
                if (live) reportError(cause);
              },
            });
          } catch (cause) {
            reportError(cause);
            return;
          }
          setEngine(next);
        },
      ),
    );
    createEffect(() => {
      const current = engine();
      const value = snapshot().value;
      if (!current || !value) return;
      const before = errorRevision;
      try {
        current.update(value);
      } catch (cause) {
        reportError(cause);
        return;
      }
      if (before === errorRevision) setError(undefined);
    });
  });
  const retry = () => {
    setRevision((value) => value + 1);
    local.onRetry?.();
  };
  return (
    <div {...rest} class={cx(styles.root, local.class)} style={local.style}>
      <TradingViewChartToolbar
        symbol={local.symbol}
        interval={local.interval}
        intervals={local.intervals}
        onIntervalChange={local.onIntervalChange}
        indicators={availableIndicators()}
        activeIndicators={indicators()}
        onIndicatorToggle={(indicator) =>
          setIndicators(
            indicators().some((active) => active.id === indicator.id)
              ? indicators().filter((active) => active.id !== indicator.id)
              : [...indicators(), indicator],
          )
        }
        volume={volume()}
        onVolumeToggle={() => setVolume(!volume())}
        onFit={() => engine()?.fitContent()}
        onZoom={(factor) => engine()?.zoom(factor)}
        onPan={(fraction) => engine()?.pan(fraction)}
      />
      <Show when={snapshot().value}>
        <TradingViewChartMetrics point={selectedPoint()} locale={local.locale} />
      </Show>
      <Show when={local.status !== 'idle'}>
        <div role="status">
          <Badge tone={failed() ? 'danger' : 'neutral'} dot>
            {translate(STATUS_KEYS[failed() ? 'error' : local.status])}
          </Badge>
        </div>
      </Show>
      <Show when={local.stale}>
        <div role="status">
          <Badge tone="warning">{translate('velvetData.trading.stale')}</Badge>
        </div>
      </Show>
      <div
        class={styles.plot}
        style={{
          height: `${Number.isFinite(local.height) && local.height > 0 ? local.height : DEFAULT_TRADING_HEIGHT}px`,
        }}
      >
        <div
          ref={(node) => {
            element = node;
          }}
          class={styles.canvas}
          role="img"
          aria-label={translate('velvetData.trading.chartLabel', { symbol: local.symbol })}
        />
        <Show when={failed() || local.data.length === 0}>
          <div class={styles.overlay}>
            <EmptyState
              size="sm"
              title={translate(failed() ? 'velvetData.trading.error' : 'velvetData.trading.empty')}
              actions={
                <Show when={failed()}>
                  <Button size="sm" variant="secondary" onClick={retry}>
                    {translate('velvetData.trading.retry')}
                  </Button>
                </Show>
              }
            />
          </div>
        </Show>
      </div>
      <Show when={snapshot().value}>
        <TradingViewChartData data={local.data} locale={local.locale} />
      </Show>
    </div>
  );
};

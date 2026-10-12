import { Button, OptionSwitcher, Text } from '@jankrajewskiit/ui';
import { For, Show } from 'solid-js';

import { useTranslate } from '../i18n/useTranslate';
import type { TradingIndicator, TradingViewChartProps } from './tradingTypes';
import styles from './TradingViewChart.module.css';

export interface TradingViewChartToolbarProps {
  readonly symbol: string;
  readonly interval?: string;
  readonly intervals?: TradingViewChartProps['intervals'];
  readonly onIntervalChange?: (interval: string) => void;
  readonly indicators: readonly TradingIndicator[];
  readonly activeIndicators: readonly TradingIndicator[];
  readonly onIndicatorToggle: (indicator: TradingIndicator) => void;
  readonly volume: boolean;
  readonly onVolumeToggle: () => void;
  readonly onFit: () => void;
  readonly onZoom: (factor: number) => void;
  readonly onPan: (fraction: number) => void;
}

export const TradingViewChartToolbar = (props: TradingViewChartToolbarProps) => {
  const translate = useTranslate();
  return (
    <div class={styles.toolbar}>
      <Text as="span" variant="title">
        {props.symbol}
      </Text>
      <Show when={props.intervals?.length && props.interval !== undefined && props.onIntervalChange}>
        <OptionSwitcher
          options={props.intervals ?? []}
          value={props.interval}
          onValueChange={props.onIntervalChange}
          size="sm"
          label={translate('velvetData.trading.interval')}
        />
      </Show>
      <div class={styles.controls}>
        <Button variant="ghost" size="sm" aria-pressed={props.volume} onClick={props.onVolumeToggle}>
          {translate('velvetData.trading.volume')}
        </Button>
        <For each={props.indicators}>
          {(indicator) => (
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={props.activeIndicators.some((active) => active.id === indicator.id)}
              onClick={() => props.onIndicatorToggle(indicator)}
            >
              {translate('velvetData.trading.indicator', {
                kind: indicator.kind.toUpperCase(),
                period: indicator.period,
              })}
            </Button>
          )}
        </For>
      </div>
      <div class={styles.controls}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onPan(-0.5)}
          aria-label={translate('velvetData.trading.panLeft')}
          iconLeft="chevron-left"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onPan(0.5)}
          aria-label={translate('velvetData.trading.panRight')}
          iconLeft="chevron-right"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onZoom(0.8)}
          aria-label={translate('velvetData.trading.zoomIn')}
          iconLeft="plus"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => props.onZoom(1.25)}
          aria-label={translate('velvetData.trading.zoomOut')}
          iconLeft="minus"
        />
        <Button variant="secondary" size="sm" onClick={props.onFit}>
          {translate('velvetData.trading.fit')}
        </Button>
      </div>
    </div>
  );
};

import { useI18n } from '@jankrajewskiit/i18n';
import { Text } from '@jankrajewskiit/ui/bare';
import { createMemo, For, Show } from 'solid-js';

import { useTranslate } from '../i18n/useTranslate';
import type { TradingViewChartPoint } from './tradingTypes';
import styles from './TradingViewChartMetrics.module.css';

export interface TradingViewChartMetricsProps {
  readonly point?: TradingViewChartPoint;
  readonly locale?: string;
}

export const TradingViewChartMetrics = (props: TradingViewChartMetricsProps) => {
  const translate = useTranslate();
  const i18n = useI18n();
  const number = createMemo(() => new Intl.NumberFormat(props.locale ?? i18n.locale(), { maximumFractionDigits: 6 }));
  const time = createMemo(
    () =>
      new Intl.DateTimeFormat(props.locale ?? i18n.locale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }),
  );
  const values = () => {
    const point = props.point;
    return point
      ? [
          { label: translate('velvetData.trading.open'), value: point.open },
          { label: translate('velvetData.trading.high'), value: point.high },
          { label: translate('velvetData.trading.low'), value: point.low },
          { label: translate('velvetData.trading.close'), value: point.close },
          { label: translate('velvetData.trading.volume'), value: point.volume },
        ]
      : [];
  };
  return (
    <div class={styles.root}>
      <Show when={props.point}>
        {(point) => (
          <Text
            as="time"
            variant="caption"
            tone="secondary"
            tabular
            dateTime={new Date(point().time * 1000).toISOString()}
          >
            {time().format(point().time * 1000)}
          </Text>
        )}
      </Show>
      <dl class={styles.values}>
        <For each={values()}>
          {(metric) => (
            <div>
              <Text as="dt" variant="caption" tone="tertiary">
                {metric.label}
              </Text>
              <Text as="dd" variant="caption" tone="primary" mono tabular class={styles.value}>
                {number().format(metric.value)}
              </Text>
            </div>
          )}
        </For>
      </dl>
    </div>
  );
};

import { useI18n } from '@jankrajewskiit/i18n';
import { Table, type TableColumn, Text } from '@jankrajewskiit/ui/bare';
import { createMemo } from 'solid-js';

import { useTranslate } from '../i18n/useTranslate';
import type { TradingViewChartPoint } from './tradingTypes';
import styles from './TradingViewChartData.module.css';

export interface TradingViewChartDataProps {
  readonly data: readonly TradingViewChartPoint[];
  readonly locale?: string;
}

export const TradingViewChartData = (props: TradingViewChartDataProps) => {
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
  const columns = createMemo<TableColumn<TradingViewChartPoint>[]>(() => [
    { key: 'time', label: translate('velvetData.trading.time'), render: (point) => time().format(point.time * 1000) },
    {
      key: 'open',
      label: translate('velvetData.trading.open'),
      align: 'right',
      render: (point) => number().format(point.open),
    },
    {
      key: 'high',
      label: translate('velvetData.trading.high'),
      align: 'right',
      render: (point) => number().format(point.high),
    },
    {
      key: 'low',
      label: translate('velvetData.trading.low'),
      align: 'right',
      render: (point) => number().format(point.low),
    },
    {
      key: 'close',
      label: translate('velvetData.trading.close'),
      align: 'right',
      render: (point) => number().format(point.close),
    },
    {
      key: 'volume',
      label: translate('velvetData.trading.volume'),
      align: 'right',
      render: (point) => number().format(point.volume),
    },
  ]);
  return (
    <details>
      <Text as="summary" variant="body-sm" tone="secondary" class={styles.summary}>
        {translate('velvetData.trading.showData')}
      </Text>
      <Table columns={columns()} rows={[...props.data]} rowKey="time" maxHeight={240} />
    </details>
  );
};

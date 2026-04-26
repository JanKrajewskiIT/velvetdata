import type { Props } from '@jankrajewskiit/ui';
import { Button, Heading } from '@jankrajewskiit/ui';
import { For } from 'solid-js';

import styles from './TradingViewChartToolbar.module.css';

export interface TradingViewChartToolbarToggle {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface TradingViewChartToolbarProps {
  symbol: string;
  intervals: readonly string[];
  activeInterval: string;
  intervalSelectionDisabled?: boolean;
  onIntervalSelect: (interval: string) => void;
  indicatorControls: readonly TradingViewChartToolbarToggle[];
  drawingControls: readonly TradingViewChartToolbarToggle[];
  clearLabel: string;
  onClear: () => void;
}

const TradingViewChartToolbar = (props: Props<TradingViewChartToolbarProps>) => {
  return (
    <div class={styles.toolbar}>
      <div class={styles.toolbarGroup}>
        <Heading as="span" variant="titleMd" class={styles.symbol}>
          {props.symbol}
        </Heading>
        <For each={props.intervals}>
          {(interval) => (
            <Button
              type="button"
              variant={props.activeInterval === interval ? 'primary' : 'ghost'}
              size="sm"
              disabled={props.intervalSelectionDisabled}
              onClick={() => props.onIntervalSelect(interval)}
            >
              {interval}
            </Button>
          )}
        </For>
      </div>

      <div class={styles.toolbarGroup}>
        <For each={props.indicatorControls}>
          {(control) => (
            <Button type="button" variant={control.active ? 'primary' : 'ghost'} size="sm" onClick={control.onClick}>
              {control.label}
            </Button>
          )}
        </For>
      </div>

      <div class={styles.toolbarGroup}>
        <For each={props.drawingControls}>
          {(control) => (
            <Button type="button" variant={control.active ? 'primary' : 'ghost'} size="sm" onClick={control.onClick}>
              {control.label}
            </Button>
          )}
        </For>
        <Button type="button" variant="ghost" size="sm" onClick={props.onClear}>
          {props.clearLabel}
        </Button>
      </div>
    </div>
  );
};

export default TradingViewChartToolbar;

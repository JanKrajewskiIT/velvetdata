import type { RowKey } from '@jankrajewskiit/ui/common';
import { createEffect, on, onCleanup, onMount } from 'solid-js';

import type { DataGridController } from './dataGridController';
import { GridRow } from './GridRow';

export interface GridMeasuredRowProps<T extends object> {
  grid: DataGridController<T>;
  row: T;
  index: number;
  recordKey: RowKey;
}

export const GridMeasuredRow = <T extends object>(props: GridMeasuredRowProps<T>) => {
  let element!: HTMLDivElement;
  const measure = () => props.grid.window.measure(props.recordKey, element.getBoundingClientRect().height);
  onMount(() => {
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
  createEffect(
    on(
      () => [
        props.grid.expansion.open(),
        props.grid.layout.template(),
        props.grid.config.measurementKey,
        props.grid.config.dataKey,
        props.grid.config.rowHeight,
        props.row,
      ],
      () => {
        queueMicrotask(() => {
          if (element.isConnected) measure();
        });
      },
    ),
  );
  return (
    <div
      ref={(node) => {
        element = node;
      }}
      role="rowgroup"
      class="vui-grid__record"
    >
      <GridRow grid={props.grid} row={props.row} index={props.index} />
    </div>
  );
};

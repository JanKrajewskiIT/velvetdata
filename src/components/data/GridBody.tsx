import { For, Show } from 'solid-js';

import { createVirtualRecord } from './createVirtualRecord';
import type { DataGridController } from './dataGridController';
import { GridMeasuredRow } from './GridMeasuredRow';

export interface GridBodyProps<T extends object> {
  grid: DataGridController<T>;
}

export const GridBody = <T extends object>(props: GridBodyProps<T>) => (
  <>
    <For each={props.grid.window.keys()}>
      {(key) => {
        const record = createVirtualRecord(props.grid.view.rows, props.grid.rowKeys, key);
        return (
          <>
            <Show when={props.grid.window.gapBefore(key) > 0}>
              <div aria-hidden="true" style={{ height: `${props.grid.window.gapBefore(key)}px` }} />
            </Show>
            <Show when={record()}>
              {(current) => (
                <GridMeasuredRow grid={props.grid} recordKey={key} row={current().item} index={current().index} />
              )}
            </Show>
          </>
        );
      }}
    </For>
    <Show when={props.grid.window.tail() > 0}>
      <div aria-hidden="true" style={{ height: `${props.grid.window.tail()}px` }} />
    </Show>
  </>
);

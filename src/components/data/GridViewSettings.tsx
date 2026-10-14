import { Button, Popover, reportAsyncError } from '@jankrajewskiit/ui/bare';
import { createSignal, onCleanup, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { DataGridController } from './dataGridController';
import { MAX_GRID_VIEW_BYTES } from './gridViewCodec';

export interface GridViewSettingsProps<T extends object> {
  grid: DataGridController<T>;
}

export const GridViewSettings = <T extends object>(props: GridViewSettingsProps<T>) => {
  const translate = useTranslate();
  const [reading, setReading] = createSignal(false);
  let input!: HTMLInputElement;
  let request = 0;
  onCleanup(() => {
    request++;
  });
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    const current = ++request;
    const initialView = props.grid.view.state();
    const isCurrent = () => current === request && props.grid.view.state() === initialView;
    setReading(true);
    let json: string | undefined;
    try {
      if (file.size > MAX_GRID_VIEW_BYTES) throw new Error('Grid view settings exceed the maximum file size.');
      json = await file.text();
    } catch (cause) {
      if (isCurrent()) props.grid.view.reportError(cause);
    } finally {
      if (current === request) setReading(false);
    }
    if (json !== undefined && isCurrent()) props.grid.view.importSettings(json);
  };
  const exportFile = () => {
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([props.grid.view.exportSettings()], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grid-view.json';
      link.click();
    } catch (cause) {
      props.grid.view.reportError(cause);
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  };
  return (
    <Popover
      align="end"
      title={translate('velvetData.dataGrid.viewSettings')}
      trigger={
        <Button size="sm" variant="secondary" iconLeft="sliders">
          {translate('velvetData.dataGrid.viewSettings')}
        </Button>
      }
    >
      <div class="vui-dgrid__settings">
        <Button
          size="sm"
          variant="secondary"
          disabled={reading()}
          onClick={() => {
            request++;
            props.grid.view.reset();
          }}
        >
          {translate('velvetData.dataGrid.resetView')}
        </Button>
        <Button size="sm" variant="secondary" onClick={exportFile}>
          {translate('velvetData.dataGrid.exportView')}
        </Button>
        <Button size="sm" variant="secondary" disabled={reading()} onClick={() => input.click()}>
          {translate('velvetData.dataGrid.importView')}
        </Button>
        <input
          ref={(element) => {
            input = element;
          }}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label={translate('velvetData.dataGrid.importView')}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void importFile(file).catch(reportAsyncError);
          }}
        />
        <Show when={reading()}>
          <span role="status">{translate('velvetData.dataGrid.importingView')}</span>
        </Show>
      </div>
    </Popover>
  );
};

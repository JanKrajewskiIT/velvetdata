import { Button, SearchInput } from '@jankrajewskiit/ui/bare';
import { cx } from '@jankrajewskiit/ui/common';
import { createSignal, For, type JSX, mergeProps, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';
import { ColumnManagerFooter } from './ColumnManagerFooter';
import type { ColumnManagerProps } from './columnManagerTypes';
import { ColumnManagerZone } from './ColumnManagerZone';
import { createColumnDrag } from './createColumnDrag';
import { createColumnKeyboard } from './createColumnKeyboard';
import { createColumnModel } from './createColumnModel';
import { createColumnSearch } from './createColumnSearch';

const SEARCH_MIN_COLUMNS = 8;

/**
 * Table column settings: visibility (switch), order (drag the grip, or focus it and press ↑/↓ — moves cross section
 * boundaries), and freezing (pin button). Any number of columns can be pinned; sections are Pinned left · Columns ·
 * Pinned right (right appears with `pinRight` or when a column is already pinned right). Search appears past 8 columns.
 * Usually inside a Popover opened from a "Columns" button in the Table toolbar. Feed Table with `ApplyColumns(columns, state)`.
 */
export const ColumnManager = (props: ColumnManagerProps): JSX.Element => {
  const p = mergeProps({ pinRight: false } satisfies Partial<ColumnManagerProps>, props);
  const translate = useTranslate();
  const title = () => p.title ?? translate('velvetData.columnManager.title');
  const [message, setMessage] = createSignal('');
  let root!: HTMLDivElement;

  const model = createColumnModel({
    columns: () => p.columns,
    value: () => p.value,
    defaultValue: () => p.defaultValue,
    resetValue: () => p.resetValue,
    onChange: (next) => (p.onChange ?? p.onValueChange)?.(next),
    pinRight: () => p.pinRight,
    maxPinned: () => p.maxPinned,
    minVisible: () => p.minVisible,
    announce: setMessage,
  });
  const drag = createColumnDrag(model);
  const search = createColumnSearch({ inZone: model.inZone, nameOf: model.nameOf });
  const keyMove = createColumnKeyboard({ model, root: () => root, announce: setMessage });
  const manager: ColumnManagerController = { config: p, model, drag, search, keyMove };

  const showSearch = () => p.searchable ?? p.columns.length > SEARCH_MIN_COLUMNS;

  const reset = () => {
    model.reset();
    search.setQuery('');
    setMessage(translate('velvetData.columnManager.resetAnnouncement'));
  };

  return (
    <div
      ref={(element) => {
        root = element;
      }}
      class={cx('vui-colman', p.class)}
    >
      <div class="vui-colman__head">
        <span class="vui-colman__title">{title()}</span>
        <Button variant="link" size="xs" onClick={reset}>
          {translate('velvetData.columnManager.resetLabel')}
        </Button>
      </div>
      <Show when={showSearch()}>
        <SearchInput
          size="sm"
          class="vui-colman__search"
          placeholder={translate('velvetData.columnManager.searchPlaceholder')}
          aria-label={translate('velvetData.columnManager.searchLabel')}
          value={search.query()}
          onValueChange={search.setQuery}
        />
      </Show>
      <div class="vui-colman__body">
        <For each={model.zones()}>{(zone) => <ColumnManagerZone manager={manager} zone={zone} />}</For>
      </div>
      <ColumnManagerFooter manager={manager} />
      <span class="vui-sr-only" aria-live="polite">
        {message()}
      </span>
    </div>
  );
};

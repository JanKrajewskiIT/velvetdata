import { Count, SectionLabel } from '@jankrajewskiit/ui';
import { cx } from '@jankrajewskiit/ui/common';
import { For, type JSX, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';
import { ColumnManagerItem } from './ColumnManagerItem';
import type { ColumnPin } from './columnManagerTypes';
import type { Zone } from './columnZones';

export interface ColumnManagerZoneProps {
  manager: ColumnManagerController;
  zone: Zone;
}

const zoneCount = (pin: ColumnPin | null, count: number): JSX.Element => {
  if (!pin || count === 0) return undefined;
  return <Count value={count} size="sm" tone="soft" />;
};

export const ColumnManagerZone = (props: ColumnManagerZoneProps) => {
  const translate = useTranslate();
  const all = () => props.manager.model.inZone(props.zone.pin);
  const rows = () => props.manager.search.keysFor(props.zone.pin);
  const emptyDropActive = () => !!props.manager.drag.dragKey() && props.manager.drag.over()?.pin === props.zone.pin;
  return (
    <Show when={!props.manager.search.needle() || rows().length > 0}>
      <section
        class={cx('vui-colman__zone', props.zone.pin && 'vui-colman__zone--pinned')}
        aria-label={translate(props.zone.labelKey)}
      >
        <SectionLabel class="vui-colman__sec" end={zoneCount(props.zone.pin, all().length)}>
          {translate(props.zone.labelKey)}
        </SectionLabel>
        <ul
          class="vui-colman__list"
          onDragOver={(e) => props.manager.drag.dragOverZone(e, props.zone.pin)}
          onDrop={(e) => props.manager.drag.dropOnZone(e, props.zone.pin)}
        >
          <For each={rows()}>
            {(key) => <ColumnManagerItem manager={props.manager} columnKey={key} pin={props.zone.pin} />}
          </For>
          <Show when={all().length === 0}>
            <li class={cx('vui-colman__drop', emptyDropActive() && 'vui-colman__drop--on')}>
              {translate(props.zone.pin ? 'velvetData.columnManager.dropHint' : 'velvetData.columnManager.allPinned')}
            </li>
          </Show>
        </ul>
      </section>
    </Show>
  );
};

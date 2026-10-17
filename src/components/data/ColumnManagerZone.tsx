import { Count, SectionLabel, Text } from '@jankrajewskiit/ui/bare';
import { For, type JSX, Show } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';
import { ColumnManagerItem } from './ColumnManagerItem';
import type { ColumnPin } from './columnManagerTypes';
import styles from './ColumnManagerZone.module.css';
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
      <section class={styles.root} aria-label={translate(props.zone.labelKey)}>
        <SectionLabel
          class={styles.heading}
          tone={props.zone.pin ? 'brand' : undefined}
          end={zoneCount(props.zone.pin, all().length)}
        >
          {translate(props.zone.labelKey)}
        </SectionLabel>
        <ul
          class={styles.list}
          data-pinned={!!props.zone.pin || undefined}
          onDragOver={(e) => props.manager.drag.dragOverZone(e, props.zone.pin)}
          onDrop={(e) => props.manager.drag.dropOnZone(e, props.zone.pin)}
        >
          <For each={rows()}>
            {(key) => <ColumnManagerItem manager={props.manager} columnKey={key} pin={props.zone.pin} />}
          </For>
          <Show when={all().length === 0}>
            <Text
              as="li"
              variant="caption"
              tone={emptyDropActive() ? 'brand' : 'tertiary'}
              class={styles.drop}
              data-active={emptyDropActive() || undefined}
            >
              {translate(props.zone.pin ? 'velvetData.columnManager.dropHint' : 'velvetData.columnManager.allPinned')}
            </Text>
          </Show>
        </ul>
      </section>
    </Show>
  );
};

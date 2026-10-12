import { clamp, createControllable } from '@jankrajewskiit/ui/common';
import { type Accessor, createMemo, type JSX, untrack } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { columnCapabilities } from './columnCapabilities';
import type { ColumnPin, ColumnState, ManagedColumn } from './columnManagerTypes';
import { initialManagedColumns, reconcileColumnState } from './columnState';
import { type Zone, type ZoneKey, zoneOf, ZONES } from './columnZones';

export interface ColumnModelOptions {
  columns: Accessor<ManagedColumn[]>;
  value: Accessor<ColumnState[] | undefined>;
  defaultValue: Accessor<ColumnState[] | undefined>;
  resetValue: Accessor<ColumnState[] | undefined>;
  onChange: (state: ColumnState[]) => void;
  pinRight: Accessor<boolean>;
  maxPinned: Accessor<number | undefined>;
  minVisible: Accessor<number | undefined>;
  announce: (message: string) => void;
}

export interface ColumnModel {
  state: Accessor<ColumnState[]>;
  zones: Accessor<Zone[]>;
  inZone: (pin: ColumnPin | null) => ColumnState[];
  pinnedCount: () => number;
  limitReached: () => boolean;
  labelOf: (key: string) => JSX.Element;
  isLocked: (key: string) => boolean;
  canHide: (key: string) => boolean;
  canPin: (key: string) => boolean;
  canMove: (key: string) => boolean;
  nameOf: (key: string) => string;
  moveTo: (key: string, pin: ColumnPin | null, index?: number) => void;
  togglePin: (c: ColumnState) => void;
  toggleVisible: (c: ColumnState) => void;
  reset: () => void;
}

export const createColumnModel = (options: ColumnModelOptions): ColumnModel => {
  const translate = useTranslate();
  const initial = untrack(() => initialManagedColumns(options.columns()));
  const [rawState, setState] = createControllable<ColumnState[]>({
    value: options.value,
    defaultValue: options.defaultValue() ?? initial,
    onChange: options.onChange,
  });
  const state = createMemo(() => reconcileColumnState(rawState(), options.columns(), options.minVisible()));

  const zones = createMemo(() =>
    ZONES.filter((z) => z.pin !== 'right' || options.pinRight() || state().some((c) => c.pin === 'right')),
  );
  const inZone = (pin: ColumnPin | null) => state().filter((c) => c.pin === pin);
  const pinnedCount = () => state().filter((c) => c.pin).length;
  const limitReached = () => {
    const max = options.maxPinned();
    return max != null && pinnedCount() >= max;
  };
  const labelOf = (key: string) => options.columns().find((c) => c.key === key)?.label ?? key;
  const isLocked = (key: string) => !!options.columns().find((c) => c.key === key)?.locked;
  const capability = (key: string, name: keyof ReturnType<typeof columnCapabilities>) => {
    const column = options.columns().find((candidate) => candidate.key === key);
    return !!column && columnCapabilities(column)[name];
  };
  const canHide = (key: string) =>
    capability(key, 'hide') &&
    (!state().find((column) => column.key === key)?.visible ||
      state().filter((column) => column.visible).length > (options.minVisible() ?? 0));
  const canPin = (key: string) => capability(key, 'pin');
  const canMove = (key: string) => capability(key, 'move');
  const nameOf = (key: string) => {
    const label = labelOf(key);
    return typeof label === 'string' ? label : key;
  };

  const moveTo = (key: string, pin: ColumnPin | null, index?: number) => {
    const from = state().find((c) => c.key === key);
    if (!from) return;
    if (from.pin === pin ? !canMove(key) : !canPin(key)) return;
    if (pin === 'right' && !zones().some((zone) => zone.pin === 'right')) return;
    if (pin && !from.pin && limitReached()) {
      options.announce(translate('velvetData.columnManager.pinLimit', { count: options.maxPinned() }));
      return;
    }
    const without = (pinZone: ColumnPin | null) => inZone(pinZone).filter((c) => c.key !== key);
    const lists: Record<ZoneKey, ColumnState[]> = {
      left: without('left'),
      mid: without(null),
      right: without('right'),
    };
    const target = lists[zoneOf(pin)];
    target.splice(index == null ? target.length : clamp(index, 0, target.length), 0, { ...from, pin });
    setState([...lists.left, ...lists.mid, ...lists.right]);
  };

  const togglePin = (c: ColumnState) => {
    if (!canPin(c.key)) return;
    if (c.pin) {
      moveTo(c.key, null, 0);
      options.announce(translate('velvetData.columnManager.unpinned', { name: nameOf(c.key) }));
    } else if (limitReached()) {
      options.announce(translate('velvetData.columnManager.pinLimit', { count: options.maxPinned() }));
    } else {
      moveTo(c.key, 'left');
      options.announce(translate('velvetData.columnManager.pinnedLeft', { name: nameOf(c.key) }));
    }
  };
  const toggleVisible = (c: ColumnState) =>
    canHide(c.key) && setState(state().map((x) => (x.key === c.key ? { ...x, visible: !x.visible } : x)));
  const reset = () =>
    setState(
      reconcileColumnState(
        options.resetValue() ?? initialManagedColumns(options.columns()),
        options.columns(),
        options.minVisible(),
      ),
    );

  return {
    state,
    zones,
    inZone,
    pinnedCount,
    limitReached,
    labelOf,
    isLocked,
    canHide,
    canPin,
    canMove,
    nameOf,
    moveTo,
    togglePin,
    toggleVisible,
    reset,
  };
};

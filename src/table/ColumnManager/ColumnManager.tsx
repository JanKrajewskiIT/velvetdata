import type { DivCoreNativeProps, Props, SelectOption } from '@jankrajewskiit/ui';
import { Button, Card, Checkbox, classNames, Heading, IconButton, Select, Text, useI18n } from '@jankrajewskiit/ui';
import { IoArrowDown, IoArrowUp } from 'solid-icons/io';
import { batch, createMemo, For, Show, splitProps } from 'solid-js';

import styles from './ColumnManager.module.css';

export type ColumnManagerPin = 'left' | 'right' | null;
export type ColumnManagerPinning = Partial<Record<string, ColumnManagerPin>>;
export type ColumnManagerVisibility = Record<string, boolean>;

export interface ColumnManagerColumn {
  key: string;
  label: string;
  canHide?: boolean;
  canPin?: boolean;
}

interface ColumnManagerOwnProps extends Omit<DivCoreNativeProps, 'onChange'> {
  columns: readonly ColumnManagerColumn[];
  order: readonly string[];
  visibility: ColumnManagerVisibility;
  onOrderChange: (next: string[]) => void;
  onVisibilityChange: (next: ColumnManagerVisibility) => void;
  pinning?: ColumnManagerPinning;
  onPinningChange?: (next: ColumnManagerPinning) => void;
  defaultOrder?: readonly string[];
  defaultVisibility?: ColumnManagerVisibility;
  defaultPinning?: ColumnManagerPinning;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const toPinValue = (raw: string): ColumnManagerPin => {
  if (raw === 'left') return 'left';
  if (raw === 'right') return 'right';
  return null;
};

const ColumnManager = (props: Props<ColumnManagerOwnProps>) => {
  const { ts } = useI18n();
  const [local, rest] = splitProps(props, [
    'columns',
    'order',
    'visibility',
    'onOrderChange',
    'onVisibilityChange',
    'pinning',
    'onPinningChange',
    'defaultOrder',
    'defaultVisibility',
    'defaultPinning',
    'label',
    'description',
    'disabled',
    'class',
  ]);

  const orderedColumns = createMemo(() => {
    const byKey = new Map(local.columns.map((column) => [column.key, column]));
    const orderedKeys = [
      ...local.order.filter((key) => byKey.has(key)),
      ...local.columns.map((column) => column.key).filter((key) => !local.order.includes(key)),
    ];
    return orderedKeys.map((key) => byKey.get(key)).filter(Boolean) as ColumnManagerColumn[];
  });

  const isVisible = (key: string) => local.visibility[key] !== false;
  const isHidable = (column: ColumnManagerColumn) => column.canHide !== false;
  const visibleCount = createMemo(() => orderedColumns().filter((column) => isVisible(column.key)).length);
  const panelLabel = createMemo(() => local.label ?? ts('dataGrid.columns'));
  const pinOptions = createMemo<SelectOption[]>(() => [
    { value: '', label: ts('common.none') },
    { value: 'left', label: ts('dir.left') },
    { value: 'right', label: ts('dir.right') },
  ]);

  const toggleVisibility = (column: ColumnManagerColumn) => {
    if (local.disabled || !isHidable(column)) return;
    const currentlyVisible = isVisible(column.key);
    if (currentlyVisible && visibleCount() <= 1) return;
    local.onVisibilityChange({
      ...local.visibility,
      [column.key]: !currentlyVisible,
    });
  };

  const moveColumn = (columnKey: string, direction: -1 | 1) => {
    if (local.disabled) return;
    const order = orderedColumns().map((column) => column.key);
    const currentIndex = order.indexOf(columnKey);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= order.length) return;
    const nextOrder = [...order];
    const [moved] = nextOrder.splice(currentIndex, 1);
    if (!moved) return;
    nextOrder.splice(nextIndex, 0, moved);
    local.onOrderChange(nextOrder);
  };

  const setPinning = (columnKey: string, nextPin: ColumnManagerPin) => {
    local.onPinningChange?.({
      ...(local.pinning ?? {}),
      [columnKey]: nextPin,
    });
  };

  const resetAll = () => {
    const resetOrder = [...(local.defaultOrder ?? local.columns.map((column) => column.key))];
    const resetVisibility: ColumnManagerVisibility = {};
    const resetPinning: ColumnManagerPinning = {};

    for (const column of local.columns) {
      resetVisibility[column.key] = local.defaultVisibility?.[column.key] ?? true;
      resetPinning[column.key] = local.defaultPinning?.[column.key] ?? null;
    }

    batch(() => {
      local.onOrderChange(resetOrder);
      local.onVisibilityChange(resetVisibility);
      local.onPinningChange?.(resetPinning);
    });
  };

  return (
    <Card {...rest} class={classNames(styles.card, local.class)}>
      <div class={styles.header}>
        <div class={styles.headerCopy}>
          <Heading as="h3" level={3} variant="titleMd">
            {panelLabel()}
          </Heading>
          <Show when={local.description}>
            <Text as="p" variant="caption" tone="muted">
              {local.description}
            </Text>
          </Show>
        </div>
        <Button variant="ghost" size="sm" onClick={resetAll} disabled={local.disabled}>
          {ts('columnManager.resetColumns')}
        </Button>
      </div>

      <div class={styles.rows}>
        <For each={orderedColumns()}>
          {(column, index) => {
            const pinValue = () => local.pinning?.[column.key] ?? null;
            const disableVisibilityToggle = () =>
              local.disabled || !isHidable(column) || (isVisible(column.key) && visibleCount() <= 1);

            return (
              <div class={styles.row}>
                <Checkbox
                  class={styles.visibility}
                  checked={isVisible(column.key)}
                  disabled={disableVisibilityToggle()}
                  onChange={() => toggleVisibility(column)}
                  label={column.label}
                />

                <Show when={local.onPinningChange && column.canPin !== false}>
                  <Select
                    class={styles.pin}
                    size="sm"
                    aria-label={ts('common.pin')}
                    value={pinValue() ?? ''}
                    disabled={local.disabled || !isVisible(column.key)}
                    options={pinOptions()}
                    onChange={(event) => setPinning(column.key, toPinValue(event.currentTarget.value))}
                  />
                </Show>

                <div class={styles.reorder}>
                  <IconButton
                    icon={IoArrowUp}
                    label={ts('common.moveUp')}
                    size="sm"
                    disabled={local.disabled || index() === 0}
                    onClick={() => moveColumn(column.key, -1)}
                  />
                  <IconButton
                    icon={IoArrowDown}
                    label={ts('common.moveDown')}
                    size="sm"
                    disabled={local.disabled || index() === orderedColumns().length - 1}
                    onClick={() => moveColumn(column.key, 1)}
                  />
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </Card>
  );
};

export default ColumnManager;

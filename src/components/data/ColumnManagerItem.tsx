import { Handle, IconButton, Switch } from '@jankrajewskiit/ui/bare';
import { cx } from '@jankrajewskiit/ui/common';

import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';
import type { ColumnPin, ColumnState } from './columnManagerTypes';

export interface ColumnManagerItemProps {
  manager: ColumnManagerController;
  columnKey: string;
  pin: ColumnPin | null;
}

export const ColumnManagerItem = (props: ColumnManagerItemProps) => {
  const translate = useTranslate();
  const placeholder = (): ColumnState => ({ key: props.columnKey, visible: true, pin: props.pin });
  const column = () => props.manager.model.state().find((x) => x.key === props.columnKey) ?? placeholder();
  const locked = () => props.manager.model.isLocked(column().key);
  const atMax = () => !column().pin && props.manager.model.limitReached();
  const dropClass = () => {
    const target = props.manager.drag.over();
    return target?.key === column().key && props.manager.drag.dragKey() && props.manager.drag.dragKey() !== column().key
      ? `vui-colman__item--${target.pos}`
      : false;
  };
  return (
    <li
      class={cx(
        'vui-colman__item',
        !column().visible && 'vui-colman__item--off',
        props.manager.drag.dragKey() === column().key && 'vui-colman__item--drag',
        dropClass(),
      )}
      draggable={props.manager.model.canMove(column().key)}
      onDragStart={(e) => props.manager.drag.startDrag(e, column().key)}
      onDragOver={(e) => props.manager.drag.dragOverItem(e, column().key, props.pin)}
      onDragEnd={() => props.manager.drag.endDrag()}
      onDrop={(e) => props.manager.drag.dropOnItem(e, column())}
    >
      <Handle
        data-grip={column().key}
        class="vui-colman__grip"
        icon={locked() ? 'lock' : 'grip-vertical'}
        disabled={!props.manager.model.canMove(column().key)}
        label={translate('velvetData.columnManager.reorder', { name: props.manager.model.nameOf(column().key) })}
        onKeyDown={(e) => props.manager.keyMove(e, column())}
      />
      <span class="vui-colman__name">{props.manager.model.labelOf(column().key)}</span>
      <IconButton
        size="xs"
        icon="pin"
        label={translate(column().pin ? 'velvetData.columnManager.unpinLabel' : 'velvetData.columnManager.pinLabel', {
          name: props.manager.model.nameOf(column().key),
        })}
        title={translate(
          atMax()
            ? 'velvetData.columnManager.pinLimitReached'
            : column().pin
              ? 'velvetData.columnManager.unpin'
              : 'velvetData.columnManager.pinLeft',
        )}
        class={cx('vui-colman__pin', column().pin && 'vui-colman__pin--on')}
        disabled={!props.manager.model.canPin(column().key) || atMax()}
        aria-pressed={!!column().pin}
        onClick={() => props.manager.model.togglePin(column())}
      />
      <Switch
        size="sm"
        aria-label={translate('velvetData.columnManager.showColumn', {
          name: props.manager.model.nameOf(column().key),
        })}
        checked={column().visible}
        disabled={!props.manager.model.canHide(column().key)}
        onChange={() => props.manager.model.toggleVisible(column())}
      />
    </li>
  );
};

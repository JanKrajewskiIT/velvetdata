import { type Accessor, createSignal } from 'solid-js';

import type { ColumnPin, ColumnState } from './columnManagerTypes';
import type { ColumnModel } from './createColumnModel';

interface DropTarget {
  key: string | null;
  pin: ColumnPin | null;
  pos: 'above' | 'below';
}

export interface ColumnDrag {
  dragKey: Accessor<string | null>;
  over: Accessor<DropTarget | null>;
  startDrag: (e: DragEvent, key: string) => void;
  endDrag: () => void;
  dragOverItem: (e: DragEvent & { currentTarget: HTMLElement }, key: string, pin: ColumnPin | null) => void;
  dropOnItem: (e: DragEvent, c: ColumnState) => void;
  dragOverZone: (e: DragEvent, pin: ColumnPin | null) => void;
  dropOnZone: (e: DragEvent, pin: ColumnPin | null) => void;
}

export const createColumnDrag = (model: ColumnModel): ColumnDrag => {
  const [dragKey, setDragKey] = createSignal<string | null>(null);
  const [over, setOver] = createSignal<DropTarget | null>(null);

  const startDrag = (e: DragEvent, key: string) => {
    if (!model.canMove(key)) {
      e.preventDefault();
      return;
    }
    setDragKey(key);
    if (!e.dataTransfer) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const endDrag = () => {
    setDragKey(null);
    setOver(null);
  };

  const dragOverItem = (e: DragEvent & { currentTarget: HTMLElement }, key: string, pin: ColumnPin | null) => {
    if (!dragKey()) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setOver({ key, pin, pos: e.clientY < rect.top + rect.height / 2 ? 'above' : 'below' });
  };

  const dropOnItem = (e: DragEvent, c: ColumnState) => {
    e.preventDefault();
    e.stopPropagation();
    const dragged = dragKey();
    if (dragged && over()) {
      const list = model.inZone(c.pin).filter((x) => x.key !== dragged);
      let index = list.findIndex((x) => x.key === c.key);
      if (over()?.pos === 'below') index++;
      const draggedPinned = !!model.state().find((x) => x.key === dragged)?.pin;
      if (!(c.pin && !draggedPinned && model.limitReached())) model.moveTo(dragged, c.pin, index);
    }
    endDrag();
  };

  const dragOverZone = (e: DragEvent, pin: ColumnPin | null) => {
    if (!dragKey() || model.inZone(pin).length) return;
    e.preventDefault();
    setOver({ key: null, pin, pos: 'below' });
  };

  const dropOnZone = (e: DragEvent, pin: ColumnPin | null) => {
    const dragged = dragKey();
    if (!dragged || model.inZone(pin).length) return;
    e.preventDefault();
    model.moveTo(dragged, pin, 0);
    endDrag();
  };

  return { dragKey, over, startDrag, endDrag, dragOverItem, dropOnItem, dragOverZone, dropOnZone };
};

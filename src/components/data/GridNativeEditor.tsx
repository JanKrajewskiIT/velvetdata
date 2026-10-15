import { createEffect, For, type JSX, Show } from 'solid-js';

import type { GridEditorContext } from './gridEditorTypes';
import styles from './GridNativeEditor.module.css';

export interface GridNativeEditorProps<T extends object> {
  context: GridEditorContext<T>;
  options?: readonly string[];
  numeric: boolean;
  label: string;
  onBlur: () => void;
}

const focusOnMount = (element: HTMLElement) =>
  queueMicrotask(() => {
    if (element.isConnected) element.focus({ preventScroll: true });
  });

export const GridNativeEditor = <T extends object>(props: GridNativeEditorProps<T>) => {
  let control: HTMLElement | undefined;
  const ref = (element: HTMLElement) => {
    control = element;
    focusOnMount(element);
  };
  createEffect(() => {
    if (props.context.pending || !props.context.error || !control) return;
    if (control.ownerDocument.activeElement === control.ownerDocument.body) focusOnMount(control);
  });
  const onKeyDown: JSX.EventHandler<HTMLElement, KeyboardEvent> = (event) => {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      props.context.commit(event.key === 'Enter' ? 'down' : event.shiftKey ? 'left' : 'right');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      props.context.cancel();
    }
  };
  const attributes = {
    class: styles.control,
    get value() {
      return props.context.draft;
    },
    get 'aria-label'() {
      return props.label;
    },
    get 'aria-invalid'() {
      return !!props.context.error || undefined;
    },
    get 'aria-describedby'() {
      return props.context.error ? props.context.errorId : undefined;
    },
    onKeyDown,
    onBlur: () => props.onBlur(),
  };
  return (
    <Show
      when={props.options}
      fallback={
        <input
          {...attributes}
          ref={ref}
          readOnly={props.context.pending}
          inputMode={props.numeric ? 'decimal' : undefined}
          onInput={(event) => props.context.setDraft(event.currentTarget.value)}
        />
      }
    >
      {(options) => (
        <select
          {...attributes}
          ref={ref}
          disabled={props.context.pending}
          onChange={(event) => props.context.setDraft(event.currentTarget.value)}
        >
          <For each={options()}>
            {(option) => (
              <option value={option} selected={option === props.context.draft}>
                {option}
              </option>
            )}
          </For>
        </select>
      )}
    </Show>
  );
};

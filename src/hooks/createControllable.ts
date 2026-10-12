import { type Accessor, createSignal } from 'solid-js';

export interface ControllableOptions<T> {
  /** Controlled value; `undefined` means the component is uncontrolled. */
  value: Accessor<T | undefined>;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** Controlled/uncontrolled state: reads `value` when provided, otherwise owns the state. */
export const createControllable = <T>(options: ControllableOptions<T>): [Accessor<T>, (next: T) => void] => {
  const [inner, setInner] = createSignal<T>(options.defaultValue);
  const current = () => {
    const controlled = options.value();
    return controlled !== undefined ? controlled : inner();
  };
  const set = (next: T) => {
    if (options.value() === undefined) setInner(() => next);
    options.onChange?.(next);
  };
  return [current, set];
};

import { type Accessor, createSignal, type Setter } from 'solid-js';

import type { ColumnPin, ColumnState } from './columnManagerTypes';

export interface ColumnSearchOptions {
  inZone: (pin: ColumnPin | null) => ColumnState[];
  nameOf: (key: string) => string;
}

export interface ColumnSearch {
  query: Accessor<string>;
  setQuery: Setter<string>;
  needle: () => string;
  keysFor: (pin: ColumnPin | null) => string[];
}

export const createColumnSearch = (options: ColumnSearchOptions): ColumnSearch => {
  const [query, setQuery] = createSignal('');
  const needle = () => query().trim().toLowerCase();
  const keysFor = (pin: ColumnPin | null) =>
    options
      .inZone(pin)
      .filter((c) => !needle() || options.nameOf(c.key).toLowerCase().includes(needle()))
      .map((c) => c.key);
  return { query, setQuery, needle, keysFor };
};

import type { RowKey } from '@jankrajewskiit/ui/common';
import { type Accessor, createMemo } from 'solid-js';

import type { VirtualKeys } from './createVirtualKeys';

interface VirtualRecord<T> {
  item: T;
  index: number;
}

/** A renderer receives a new snapshot only when its record or numeric index changes. */
export const createVirtualRecord = <T>(items: Accessor<readonly T[]>, keys: VirtualKeys, key: RowKey) =>
  createMemo<VirtualRecord<T> | undefined>(
    () => {
      const index = keys.indexOf(key);
      return index < 0 ? undefined : { item: items()[index] as T, index };
    },
    undefined,
    { equals: (previous, next) => previous?.item === next?.item && previous?.index === next?.index },
  );

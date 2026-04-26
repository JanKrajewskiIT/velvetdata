import type { Props } from '@jankrajewskiit/ui';
import { filterRows, sortRows, useClickOutside, useEscapeKey } from '@jankrajewskiit/ui';
import type { JSX } from 'solid-js';
import { batch, createEffect, createMemo, createSignal, on, onCleanup } from 'solid-js';

import type {
  DataGridProColumn,
  DataGridProColumnPin,
  DataGridProColumnPinning,
  DataGridProProps,
  DataGridProSortDirection,
  DataGridProSortState,
} from './DataGridPro.types';

interface ResizeState {
  key: string;
  startX: number;
  startWidth: number;
}

interface PersistedGridState {
  v: number;
  filterQuery?: string;
  sortKey?: string | null;
  sortDirection?: DataGridProSortDirection;
  columnOrder?: string[];
  columnVisibility?: Record<string, boolean>;
  columnPinning?: DataGridProColumnPinning;
  columnWidths?: Record<string, number>;
}

const DEFAULT_COLUMN_WIDTH = 180;
const SELECTION_COLUMN_WIDTH = 44;
const DATA_GRID_PERSISTENCE_VERSION = 1;

const parseWidth = (width: number | string | undefined): number => {
  if (typeof width === 'number') return width;
  if (typeof width === 'string') {
    const parsed = Number(width.replace('px', '').trim());
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_COLUMN_WIDTH;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const useDataGridProState = <T extends Record<string, unknown>>(props: Props<DataGridProProps<T>>) => {
  const [internalSortKey, setInternalSortKey] = createSignal<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = createSignal<DataGridProSortDirection>('asc');
  const [internalFilterQuery, setInternalFilterQuery] = createSignal(props.defaultFilterQuery ?? '');
  const [internalSelectedRowIds, setInternalSelectedRowIds] = createSignal(props.defaultSelectedRowIds ?? []);
  const [internalColumnOrder, setInternalColumnOrder] = createSignal<string[]>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = createSignal(props.defaultColumnVisibility ?? {});
  const [internalColumnPinning, setInternalColumnPinning] = createSignal(props.defaultColumnPinning ?? {});
  const [columnWidths, setColumnWidths] = createSignal<Record<string, number>>({});
  const [resizeState, setResizeState] = createSignal<ResizeState | null>(null);
  const [scrollTop, setScrollTop] = createSignal(0);
  const [draggingColumnKey, setDraggingColumnKey] = createSignal<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = createSignal<string | null>(null);
  const [columnMenuOpen, setColumnMenuOpen] = createSignal(false);
  const [hydratedPersistence, setHydratedPersistence] = createSignal(false);
  const [persistenceSaveReady, setPersistenceSaveReady] = createSignal(false);
  const [hasPersistedLayout, setHasPersistedLayout] = createSignal(false);
  let columnMenuWrapRef: HTMLDivElement | undefined;
  let importFileInputRef: HTMLInputElement | undefined;

  const sortKey = () => props.sortKey ?? internalSortKey();
  const sortDirection = () => props.sortDirection ?? internalSortDirection();
  const filterQuery = () => props.filterQuery ?? internalFilterQuery();
  const selectedRowIds = () => props.selectedRowIds ?? internalSelectedRowIds();
  const currentColumnOrder = () => props.columnOrder ?? internalColumnOrder();
  const currentColumnVisibility = () => props.columnVisibility ?? internalColumnVisibility();
  const currentColumnPinning = () => props.columnPinning ?? internalColumnPinning();

  const rowHeight = () => props.rowHeight ?? 40;
  const headerHeight = () => props.headerHeight ?? 44;
  const viewportHeight = () => props.height ?? 420;
  const overscan = () => props.overscan ?? 6;
  const selectable = () => props.selectable ?? false;
  const reorderable = () => props.reorderable ?? true;
  const showToolbar = () => props.showToolbar ?? true;
  const persistenceStorageKey = () => (props.persistenceKey ? `velvetui.datagridpro.${props.persistenceKey}` : '');

  createEffect(
    on(
      () => props.columns,
      (columns) => {
        const keys = columns.map((column) => column.key);
        const keysSet = new Set(keys);
        const byKey = new Map(columns.map((column) => [column.key, column]));
        const defaultOrder = props.defaultColumnOrder ?? keys;

        batch(() => {
          setColumnWidths((prev) => {
            const next: Record<string, number> = {};
            for (const column of columns) {
              next[column.key] = prev[column.key] ?? parseWidth(column.width);
            }
            return next;
          });

          setInternalColumnOrder((prev) => {
            const fromPrev = prev.filter((key) => keysSet.has(key));
            const missing = keys.filter((key) => !fromPrev.includes(key));
            return prev.length === 0 ? defaultOrder : [...fromPrev, ...missing];
          });

          setInternalColumnVisibility((prev) => {
            const next: Record<string, boolean> = {};
            for (const key of keys) {
              next[key] = prev[key] ?? props.defaultColumnVisibility?.[key] ?? true;
            }
            return next;
          });

          setInternalColumnPinning((prev) => {
            const next: DataGridProColumnPinning = {};
            for (const key of keys) {
              next[key] = prev[key] ?? props.defaultColumnPinning?.[key] ?? byKey.get(key)?.pinned ?? null;
            }
            return next;
          });
        });
      },
    ),
  );

  const getRowId = (row: T, index: number): string => {
    if (props.getRowId) return props.getRowId(row, index);
    return String(index);
  };

  const getColumnByKey = (key: string) => props.columns.find((column) => column.key === key);
  const keyOrderDefault = () => props.defaultColumnOrder ?? props.columns.map((column) => column.key);
  const visibilityDefault = () => {
    const next: Record<string, boolean> = {};
    for (const column of props.columns) {
      const key = column.key;
      next[key] = props.defaultColumnVisibility?.[key] ?? true;
    }
    return next;
  };
  const pinningDefault = () => {
    const next: DataGridProColumnPinning = {};
    for (const column of props.columns) {
      const key = column.key;
      next[key] = props.defaultColumnPinning?.[key] ?? column.pinned ?? null;
    }
    return next;
  };

  const isColumnSortable = (column: DataGridProColumn<T>) => {
    if (column.sortable !== undefined) return column.sortable;
    return props.sortable ?? true;
  };

  const setSortState = (state: DataGridProSortState) => {
    batch(() => {
      setInternalSortKey(state.key);
      setInternalSortDirection(state.direction);
      props.onSortChange?.(state);
    });
  };

  const setColumnOrder = (nextOrder: string[]) => {
    batch(() => {
      setInternalColumnOrder(nextOrder);
      props.onColumnOrderChange?.(nextOrder);
    });
  };

  const setColumnVisibility = (nextVisibility: Record<string, boolean>) => {
    batch(() => {
      setInternalColumnVisibility(nextVisibility);
      props.onColumnVisibilityChange?.(nextVisibility);
    });
  };

  const setColumnPinning = (nextPinning: DataGridProColumnPinning) => {
    batch(() => {
      setInternalColumnPinning(nextPinning);
      props.onColumnPinningChange?.(nextPinning);
    });
  };

  const applyGridState = (state: PersistedGridState): boolean => {
    if (state.v !== DATA_GRID_PERSISTENCE_VERSION) return false;

    batch(() => {
      if (props.filterQuery == null && typeof state.filterQuery === 'string') {
        setInternalFilterQuery(state.filterQuery);
        props.onFilterQueryChange?.(state.filterQuery);
      }

      if (!props.sortKey) {
        setInternalSortKey(state.sortKey ?? null);
      }

      if (!props.sortDirection && state.sortDirection) {
        setInternalSortDirection(state.sortDirection);
      }

      if (!props.sortKey || !props.sortDirection) {
        props.onSortChange?.({
          key: props.sortKey ?? state.sortKey ?? null,
          direction: props.sortDirection ?? state.sortDirection ?? 'asc',
        });
      }

      if (!props.columnOrder && Array.isArray(state.columnOrder)) {
        setInternalColumnOrder(state.columnOrder);
        props.onColumnOrderChange?.(state.columnOrder);
      }

      if (!props.columnVisibility && state.columnVisibility && typeof state.columnVisibility === 'object') {
        setInternalColumnVisibility(state.columnVisibility);
        props.onColumnVisibilityChange?.(state.columnVisibility);
      }

      if (!props.columnPinning && state.columnPinning && typeof state.columnPinning === 'object') {
        setInternalColumnPinning(state.columnPinning);
        props.onColumnPinningChange?.(state.columnPinning);
      }

      if (state.columnWidths && typeof state.columnWidths === 'object') {
        setColumnWidths((prev) => ({ ...prev, ...state.columnWidths }));
      }
    });

    return true;
  };

  const loadPersistedState = () => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
    const storageKey = persistenceStorageKey();
    if (!storageKey) return;

    const serialized = window.localStorage.getItem(storageKey);
    if (!serialized) {
      setHasPersistedLayout(false);
      return;
    }

    try {
      const parsed = JSON.parse(serialized) as PersistedGridState;
      if (applyGridState(parsed)) {
        setHasPersistedLayout(true);
        return;
      }
      setHasPersistedLayout(false);
    } catch {
      setHasPersistedLayout(false);
    }
  };

  const getGridStatePayload = (): PersistedGridState => ({
    v: DATA_GRID_PERSISTENCE_VERSION,
    filterQuery: filterQuery(),
    sortKey: sortKey(),
    sortDirection: sortDirection(),
    columnOrder: currentColumnOrder(),
    columnVisibility: currentColumnVisibility(),
    columnPinning: currentColumnPinning(),
    columnWidths: columnWidths(),
  });

  const writePersistedState = (storageKey: string, payload: PersistedGridState) => {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setHasPersistedLayout(true);
    } catch {
      void 0;
    }
  };

  const handleSort = (column: DataGridProColumn<T>) => {
    if (!isColumnSortable(column)) return;
    if (sortKey() === column.key) {
      const nextDirection: DataGridProSortDirection = sortDirection() === 'asc' ? 'desc' : 'asc';
      setSortState({ key: column.key, direction: nextDirection });
      return;
    }
    setSortState({ key: column.key, direction: 'asc' });
  };

  const filteredData = createMemo(() => {
    if (props.manualFiltering) return props.data;
    return filterRows({
      rows: props.data,
      query: filterQuery(),
      columns: props.columns,
      filterFn: props.filterFn,
    });
  });

  const sortedData = createMemo(() => {
    if (props.manualSorting) return filteredData();
    return sortRows({
      rows: filteredData(),
      sortKey: sortKey(),
      direction: sortDirection(),
      getColumnByKey,
    });
  });

  const bodyHeight = createMemo(() => Math.max(0, viewportHeight() - headerHeight()));
  const totalRowsHeight = createMemo(() => sortedData().length * rowHeight());
  const visibleCount = createMemo(() => Math.ceil(bodyHeight() / rowHeight()) + overscan() * 2);
  const startIndex = createMemo(() => {
    const relativeTop = Math.max(0, scrollTop() - headerHeight());
    return Math.max(0, Math.floor(relativeTop / rowHeight()) - overscan());
  });
  const endIndex = createMemo(() => Math.min(sortedData().length, startIndex() + visibleCount()));
  const offsetY = createMemo(() => startIndex() * rowHeight());
  const visibleRows = createMemo(() =>
    sortedData()
      .slice(startIndex(), endIndex())
      .map((row, offset) => ({
        row,
        index: startIndex() + offset,
        id: getRowId(row, startIndex() + offset),
      })),
  );

  const orderedColumns = createMemo(() => {
    const byKey = new Map(props.columns.map((column) => [column.key, column]));
    const order = currentColumnOrder();
    const normalizedOrder = [
      ...order.filter((key) => byKey.has(key)),
      ...Array.from(byKey.keys()).filter((key) => !order.includes(key)),
    ];
    return normalizedOrder.map((key) => byKey.get(key)).filter(Boolean) as DataGridProColumn<T>[];
  });

  const visibleColumns = createMemo(() =>
    orderedColumns().filter((column) => currentColumnVisibility()[column.key] !== false),
  );

  const getColumnPin = (column: DataGridProColumn<T>): DataGridProColumnPin => {
    const pin = currentColumnPinning()[column.key];
    if (pin === 'left' || pin === 'right') return pin;
    if (pin === null) return null;
    return column.pinned ?? null;
  };

  const pinnedLeftColumns = createMemo(() => visibleColumns().filter((column) => getColumnPin(column) === 'left'));
  const pinnedRightColumns = createMemo(() => visibleColumns().filter((column) => getColumnPin(column) === 'right'));
  const pinnedLeftOffsets = createMemo(() => {
    const offsets: Record<string, number> = {};
    let offset = selectable() ? SELECTION_COLUMN_WIDTH : 0;
    for (const column of pinnedLeftColumns()) {
      offsets[column.key] = offset;
      offset += columnWidths()[column.key] ?? DEFAULT_COLUMN_WIDTH;
    }
    return offsets;
  });
  const pinnedRightOffsets = createMemo(() => {
    const offsets: Record<string, number> = {};
    let offset = 0;
    for (const column of [...pinnedRightColumns()].reverse()) {
      offsets[column.key] = offset;
      offset += columnWidths()[column.key] ?? DEFAULT_COLUMN_WIDTH;
    }
    return offsets;
  });

  const getColumnStyle = (column: DataGridProColumn<T>): JSX.CSSProperties => {
    const width = `${String(columnWidths()[column.key] ?? DEFAULT_COLUMN_WIDTH)}px`;
    const pin = getColumnPin(column);
    const base: JSX.CSSProperties = { '--col-width': width };
    if (pin === 'left') {
      return { ...base, '--col-pin-offset': `${String(pinnedLeftOffsets()[column.key] ?? 0)}px` };
    }
    if (pin === 'right') {
      return { ...base, '--col-pin-offset': `${String(pinnedRightOffsets()[column.key] ?? 0)}px` };
    }
    return base;
  };

  let scrollRafId: number | undefined;
  let pendingScrollTop = 0;
  const handleScroll: JSX.EventHandler<HTMLDivElement, Event> = (event) => {
    pendingScrollTop = event.currentTarget.scrollTop;
    if (scrollRafId !== undefined) return;
    scrollRafId = requestAnimationFrame(() => {
      scrollRafId = undefined;
      setScrollTop(pendingScrollTop);
    });
  };

  onCleanup(() => {
    if (scrollRafId !== undefined) cancelAnimationFrame(scrollRafId);
  });

  const setFilterValue = (next: string) => {
    batch(() => {
      setInternalFilterQuery(next);
      props.onFilterQueryChange?.(next);
    });
  };

  const handleFilterInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    setFilterValue(event.currentTarget.value);
  };

  const selectedSet = createMemo(() => new Set(selectedRowIds()));

  const updateSelection = (next: string[]) => {
    batch(() => {
      setInternalSelectedRowIds(next);
      props.onSelectedRowIdsChange?.(next);
    });
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedSet());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    updateSelection(Array.from(next));
  };

  const allVisibleSelected = createMemo(() => {
    const ids = sortedData().map((row, index) => getRowId(row, index));
    if (ids.length === 0) return false;
    return ids.every((id) => selectedSet().has(id));
  });

  const toggleAllVisible = () => {
    const ids = sortedData().map((row, index) => getRowId(row, index));
    const next = new Set(selectedSet());
    if (allVisibleSelected()) {
      for (const id of ids) next.delete(id);
    } else {
      for (const id of ids) next.add(id);
    }
    updateSelection(Array.from(next));
  };

  const handleResizeStart = (columnKey: string, event: MouseEvent) => {
    event.preventDefault();
    setResizeState({
      key: columnKey,
      startX: event.clientX,
      startWidth: columnWidths()[columnKey] ?? DEFAULT_COLUMN_WIDTH,
    });
  };

  const handleColumnVisibilityToggle = (key: string) => {
    const visibility = { ...currentColumnVisibility() };
    const currentlyVisible = visibleColumns().length;
    const isVisible = visibility[key] !== false;
    if (isVisible && currentlyVisible <= 1) return;
    visibility[key] = !isVisible;
    setColumnVisibility(visibility);
  };

  const resetColumns = () => {
    setColumnOrder(keyOrderDefault());
    setColumnVisibility(visibilityDefault());
    setColumnPinning(pinningDefault());
  };

  const resetView = () => {
    batch(() => {
      setFilterValue('');
      setSortState({ key: null, direction: 'asc' });
      updateSelection([]);
      resetColumns();
    });
  };

  const resetPersistedLayout = () => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const storageKey = persistenceStorageKey();
      if (storageKey) {
        window.localStorage.removeItem(storageKey);
      }
    }
    batch(() => {
      setHasPersistedLayout(false);
      setPersistenceSaveReady(false);
      resetView();
      props.onPersistenceReset?.();
    });
  };

  const clearSelection = () => {
    updateSelection([]);
  };

  const exportSettings = () => {
    const payload = getGridStatePayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${props.persistenceKey ?? 'datagridpro-settings'}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importFileInputRef?.click();
  };

  const handleImportFile: JSX.EventHandler<HTMLInputElement, Event> = (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    const storageKey = persistenceStorageKey();

    void (async () => {
      try {
        const content = await file.text();
        const parsed = JSON.parse(content) as PersistedGridState;
        if (!applyGridState(parsed)) return;

        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && storageKey) {
          try {
            writePersistedState(storageKey, parsed);
          } catch {
            void 0;
          }
        }
      } catch {
        void 0;
      }
    })();
  };

  const handleHeaderDragStart = (key: string, event: DragEvent) => {
    if (!reorderable()) return;
    setDraggingColumnKey(key);
    event.dataTransfer?.setData('text/plain', key);
    if (event.currentTarget instanceof Element) {
      event.dataTransfer?.setDragImage(event.currentTarget, 8, 8);
    }
  };

  const handleHeaderDragOver = (key: string, event: DragEvent) => {
    if (!reorderable()) return;
    event.preventDefault();
    setDragOverColumnKey(key);
  };

  const handleHeaderDrop = (targetKey: string, event: DragEvent) => {
    if (!reorderable()) return;
    event.preventDefault();
    const sourceKey = draggingColumnKey();
    batch(() => {
      setDraggingColumnKey(null);
      setDragOverColumnKey(null);
      if (!sourceKey || sourceKey === targetKey) return;

      const order = [...currentColumnOrder()];
      const sourceIndex = order.indexOf(sourceKey);
      const targetIndex = order.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return;
      order.splice(sourceIndex, 1);
      order.splice(targetIndex, 0, sourceKey);
      setColumnOrder(order);
    });
  };

  const handleHeaderDragEnd = () => {
    batch(() => {
      setDraggingColumnKey(null);
      setDragOverColumnKey(null);
    });
  };

  useClickOutside(
    () => columnMenuWrapRef,
    columnMenuOpen,
    () => setColumnMenuOpen(false),
  );
  useEscapeKey(
    () => columnMenuOpen(),
    () => setColumnMenuOpen(false),
  );

  createEffect(() => {
    const active = resizeState();
    if (!active) return;

    let rafId: number | undefined;
    let pendingClientX = active.startX;

    const flush = () => {
      rafId = undefined;
      const column = getColumnByKey(active.key);
      if (!column) return;

      const delta = pendingClientX - active.startX;
      const baseWidth = active.startWidth + delta;
      const min = column.minWidth ?? 80;
      const max = column.maxWidth ?? 720;
      const nextWidth = clamp(baseWidth, min, max);

      setColumnWidths((prev) => ({
        ...prev,
        [active.key]: nextWidth,
      }));
    };

    const onMouseMove = (event: MouseEvent) => {
      pendingClientX = event.clientX;
      if (rafId !== undefined) return;
      rafId = requestAnimationFrame(flush);
    };

    const onMouseUp = () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
        flush();
      }
      setResizeState(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    onCleanup(() => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    });
  });

  const gridWidth = createMemo(() => {
    const widths = columnWidths();
    return visibleColumns().reduce(
      (acc, column) => acc + (widths[column.key] ?? DEFAULT_COLUMN_WIDTH),
      selectable() ? SELECTION_COLUMN_WIDTH : 0,
    );
  });

  createEffect(() => {
    if (hydratedPersistence()) return;
    batch(() => {
      loadPersistedState();
      setHydratedPersistence(true);
    });
  });

  let persistenceSaveTimer: number | undefined;

  createEffect(
    on(
      () =>
        [
          filterQuery(),
          sortKey(),
          sortDirection(),
          currentColumnOrder(),
          currentColumnVisibility(),
          currentColumnPinning(),
          columnWidths(),
        ] as const,
      () => {
        if (!hydratedPersistence()) return;
        const storageKey = persistenceStorageKey();
        if (!storageKey) return;

        const saveReady = persistenceSaveReady();
        if (!saveReady) {
          setPersistenceSaveReady(true);
          return;
        }

        const payload = getGridStatePayload();

        if (persistenceSaveTimer !== undefined) clearTimeout(persistenceSaveTimer);
        persistenceSaveTimer = window.setTimeout(() => {
          persistenceSaveTimer = undefined;
          writePersistedState(storageKey, payload);
        }, 150);
      },
      { defer: true },
    ),
  );

  onCleanup(() => {
    if (persistenceSaveTimer !== undefined) clearTimeout(persistenceSaveTimer);
  });

  const getAriaSort = (column: DataGridProColumn<T>): 'none' | 'ascending' | 'descending' => {
    if (!isColumnSortable(column)) return 'none';
    if (sortKey() !== column.key) return 'none';
    return sortDirection() === 'asc' ? 'ascending' : 'descending';
  };

  const toggleColumnMenu = () => {
    setColumnMenuOpen((prev) => !prev);
  };

  const isColumnVisible = (key: string) => currentColumnVisibility()[key] !== false;
  const disableUncheckColumn = (key: string) => isColumnVisible(key) && visibleColumns().length <= 1;

  return {
    showToolbar,
    filterQuery,
    handleFilterInput,
    selectable,
    selectedSet,
    hasPersistence: () => Boolean(persistenceStorageKey()),
    hasPersistedLayout,
    clearSelection,
    resetView,
    resetPersistedLayout,
    handleImportClick,
    exportSettings,
    setImportFileInputRef: (value: HTMLInputElement) => {
      importFileInputRef = value;
    },
    handleImportFile,
    setColumnMenuWrapRef: (value: HTMLDivElement) => {
      columnMenuWrapRef = value;
    },
    columnMenuOpen,
    toggleColumnMenu,
    orderedColumns,
    isColumnVisible,
    disableUncheckColumn,
    handleColumnVisibilityToggle,
    resetColumns,
    viewportHeight,
    handleScroll,
    gridWidth,
    headerHeight,
    allVisibleSelected,
    toggleAllVisible,
    visibleColumns,
    isColumnSortable,
    sortKey,
    sortDirection,
    handleSort,
    getAriaSort,
    getColumnPin,
    getColumnStyle,
    reorderable,
    draggingColumnKey,
    dragOverColumnKey,
    handleHeaderDragStart,
    handleHeaderDragOver,
    handleHeaderDrop,
    handleHeaderDragEnd,
    handleResizeStart,
    hasRows: () => sortedData().length > 0,
    rowCount: () => sortedData().length,
    bodyHeight,
    totalRowsHeight,
    offsetY,
    visibleRows,
    rowHeight,
    toggleRow,
  };
};

export default useDataGridProState;

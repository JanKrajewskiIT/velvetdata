/**
 * Data-domain i18n dictionaries owned by `@jankrajewskiit/data`.
 *
 * Apps compose these layers explicitly:
 *
 * @example
 *   import { en as uiEn, pl as uiPl, defineDictionaries } from '@jankrajewskiit/ui';
 *   import { en as dataEn, pl as dataPl } from '@jankrajewskiit/data';
 *
 *   const dictionaries = defineDictionaries({
 *     en: [uiEn, dataEn],
 *     pl: [uiPl, dataPl],
 *   });
 *
 *   <VelvetProvider dictionaries={dictionaries}>...</VelvetProvider>
 *
 * The TypeScript module augmentation below extends `VelvetI18nDictionary`
 * so that every `useI18n().ts(...)` callsite in apps consuming `@jankrajewskiit/data`
 * gains autocomplete and compile-time checking for these keys.
 */

import { defineDictionary, type TranslationOf } from '@jankrajewskiit/ui';

export const en = defineDictionary({
  columnManager: {
    resetColumns: 'Reset columns',
    columnVisibility: 'Column visibility',
  },
  query: {
    clearRules: 'Clear rules',
    addRule: 'Add rule',
    empty: 'No rules defined',
    combinator: {
      and: 'All rules (AND)',
      or: 'Any rule (OR)',
    },
    operator: {
      equals: 'Equals',
      notEquals: 'Does not equal',
      contains: 'Contains',
      startsWith: 'Starts with',
      endsWith: 'Ends with',
      gt: 'Greater than',
      gte: 'Greater than or equal to',
      lt: 'Less than',
      lte: 'Less than or equal to',
      isEmpty: 'Is empty',
      isNotEmpty: 'Is not empty',
    },
    moveRuleUp: 'Move rule up',
    moveRuleDown: 'Move rule down',
    removeRule: 'Remove rule',
  },
  dataGrid: {
    rowsCount: '{count} rows',
    selectedCount: '{count} selected',
    selectRow: 'Select row {id}',
    noRows: 'No rows to display',
    selectAllVisibleRows: 'Select all visible rows',
    resizeColumn: 'Resize {label}',
    clearSelection: 'Clear selection',
    resetView: 'Reset view',
    resetSavedLayout: 'Reset saved layout',
    columns: 'Columns',
    filterRows: 'Filter rows...',
  },
  trading: {
    bbUpper: 'BB Upper',
    bbBasis: 'BB Basis',
    bbLower: 'BB Lower',
    sma20: 'SMA 20',
    ema50: 'EMA 50',
    rsi14: 'RSI 14',
    macd: 'MACD',
    macdSignal: 'MACD Signal',
    macdHist: 'MACD Hist',
    volumeShort: 'Vol',
    smaShort: 'SMA',
    emaShort: 'EMA',
    bbShort: 'BB',
    rsiShort: 'RSI',
    macdShort: 'MACD',
    trendTool: 'Trend',
    levelTool: 'Level',
    zoneTool: 'Zone',
  },
});

/** Shape of the data-domain dictionary, with widened string leaves so that
 *  other locales can supply different translations against the same key set. */
export type VelvetDataDictionary = TranslationOf<typeof en>;

export const pl: VelvetDataDictionary = {
  columnManager: {
    resetColumns: 'Resetuj kolumny',
    columnVisibility: 'Widoczność kolumn',
  },
  query: {
    clearRules: 'Wyczyść reguły',
    addRule: 'Dodaj regułę',
    empty: 'Brak zdefiniowanych reguł',
    combinator: {
      and: 'Wszystkie reguły (AND)',
      or: 'Dowolna reguła (OR)',
    },
    operator: {
      equals: 'Równa się',
      notEquals: 'Nie równa się',
      contains: 'Zawiera',
      startsWith: 'Zaczyna się od',
      endsWith: 'Kończy się na',
      gt: 'Większe niż',
      gte: 'Większe lub równe',
      lt: 'Mniejsze niż',
      lte: 'Mniejsze lub równe',
      isEmpty: 'Jest puste',
      isNotEmpty: 'Nie jest puste',
    },
    moveRuleUp: 'Przesuń regułę w górę',
    moveRuleDown: 'Przesuń regułę w dół',
    removeRule: 'Usuń regułę',
  },
  dataGrid: {
    rowsCount: '{count} wierszy',
    selectedCount: '{count} zazn.',
    selectRow: 'Wybierz wiersz {id}',
    noRows: 'Brak wierszy do wyświetlenia',
    selectAllVisibleRows: 'Wybierz wszystkie widoczne wiersze',
    resizeColumn: 'Zmień szerokość: {label}',
    clearSelection: 'Wyczyść zaznaczenie',
    resetView: 'Resetuj widok',
    resetSavedLayout: 'Resetuj zapisany układ',
    columns: 'Kolumny',
    filterRows: 'Filtruj wiersze...',
  },
  trading: {
    bbUpper: 'BB Góra',
    bbBasis: 'BB Baza',
    bbLower: 'BB Dół',
    sma20: 'SMA 20',
    ema50: 'EMA 50',
    rsi14: 'RSI 14',
    macd: 'MACD',
    macdSignal: 'MACD Sygnał',
    macdHist: 'MACD Hist',
    volumeShort: 'Wol.',
    smaShort: 'SMA',
    emaShort: 'EMA',
    bbShort: 'BB',
    rsiShort: 'RSI',
    macdShort: 'MACD',
    trendTool: 'Trend',
    levelTool: 'Poziom',
    zoneTool: 'Strefa',
  },
};

declare module '@jankrajewskiit/ui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface VelvetI18nDictionary extends VelvetDataDictionary {}
}

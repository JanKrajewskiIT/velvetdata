# Data component ownership

`DataGrid`, `ColumnManager`, `QueryBuilder`, `VirtualTable` and `VirtualList` now belong to VelvetData. Their implementations, controllers, styles, query model and saved-view helpers were moved from the sibling VelvetUi source. Low-level UI controls remain imported from `@jankrajewskiit/ui`; shared UI utilities stay in VelvetUi where its other components still use them.

Change these components' imports from `@jankrajewskiit/ui` to `@jankrajewskiit/data`. The same applies to their public types, `applyColumns`, `defaultGridView`, `reconcileGridView`, `parseGridView`, `serializeGridView`, `clearQuery`, `emptyQuery` and `describeQuery`. Import both packages' styles and compose `velvetDataMessages` with the existing provider. Migrate custom dictionary overrides from `velvet.data.{dataGrid,columnManager,virtualTable,virtualList}` and `velvet.patterns.queryBuilder` to `velvetData.{dataGrid,columnManager,virtualTable,virtualList,queryBuilder}`.

VelvetUi's reference files remain a historical design-system reference. They still contain the original data specimens; their presence is not a public UI export. The new ownership applies to `src` and package entry points. VelvetDemo has migrated these imports and added the TradingView specimens against published Data 3.4.2.

## Shared primitives

Published UI 3.4.6 provides the public `@jankrajewskiit/ui/common` entry point. All seven duplicated helper modules still have UI consumers, including menus/pickers, editable tables, comment/label/event ids and controlled components. Their implementations stay in UI; Data's copies of `cx`, `id`, `math`, `columnWidth`, `createControllable`, `createFrameFocus` and `rowData` have been removed and all their consumers import the public API. `modifier`, `percentOf`, `sortRows` and `cssLength` remain private UI helpers because Data does not use them. No helper from this set is exclusive to Data.

The shared `columnName` helper is also owned by UI and used by both table resize labels and Data's grid labels/CSV headers. The translation/fallback algorithm is shared through `createLibraryMessages`. The small package adapters supply their own dictionaries; Data owns `velvetDataMessages` and UI owns `velvetMessages`. Data requires UI `>=3.4.6 <4`. Refresh Data's dependency installation/lockfile against published UI 3.4.6 and run `npm run verify` before its next release. UI 3.4.4 has no `/common` export. Existing public Data row/translation types retain their names.

## Saved views and collections

The moved grid retains one controlled/uncontrolled `GridViewState` for search, query, sort, column settings and widths. Its version-1 codec stores settings only, limits payload size/nesting/node counts and validates nested data before schema reconciliation. Server filtering/sorting and record persistence remain consumer-owned. Stable unique `rowKey` or `getRowId` values are necessary when records are replaced or reordered; positional fallback IDs cannot preserve identity across those operations. The current grid feature contracts were preserved; `ApplyColumns` is replaced by the canonical `applyColumns` name.

`Table` and its add-row slot remain in Velvet UI. The earlier VelvetData `DataGridPro`, flat query rule API, `TableAddRowAction`, `en`/`pl` exports and UI dictionary augmentation are replaced by the current component contracts and `velvetDataMessages`. This is a breaking rewrite of the previous VelvetData API and a breaking ownership change for VelvetUi. The migrated Data API has been published as 3.4.2; the new shared-primitives integration requires a subsequent Data release using UI 3.4.6.

## Previous TradingView implementation

The deleted source contained `TradingViewChart`, private toolbar/metrics/overlay components and polling/WebSocket hooks. It bundled chart rendering, sample OHLC generation, interval changes, SMA20, EMA50, Bollinger Bands, RSI14, MACD and trend/level/zone drawing interactions in one component lifecycle. It also imported the previous Velvet UI provider and styling APIs, which no longer match the current UI source.

The new implementation composes current Velvet UI `Button`, `OptionSwitcher`, `Badge`, `EmptyState`, `Text` and `Table`. It separates chart UI, OHLC metrics, accessible records, indicator calculations, transport lifetime and an optional Lightweight Charts engine. The public contracts contain no Lightweight Charts types. The adapter follows the [Lightweight Charts API](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi).

The implemented scope includes candles, volume, configurable SMA/EMA periods, controlled interval selection, price levels, theme-aware rendering, keyboard pan/zoom/fit and polling/subscription feeds. Automatic sample generation, Bollinger Bands, RSI, MACD and interactive trend/zone drawing are not part of this revision. Consumers can extend the engine independently of Velvet UI. The former `liveFeed`, `drawings`, drawing-tool and third-party timestamp contracts do not have compatibility aliases.

## Required checks

Tooling follows VelvetUi's shared presets and compiler aliases; see [development tooling](../README.md#development-tooling). Copied reference styles retain VelvetUi's stylelint exclusion; new chart CSS Modules and owned extension styles remain checked.

From VelvetData: `npm install`, then `npm run verify`. Installation creates `node_modules` and a lockfile, contacts the configured package registry and runs `prepare` to initialize Husky hooks. Verification checks formatting, ESLint, Stylelint, the build and packed exports. Build creates `dist` and TypeScript build metadata; package verification creates a temporary package archive. `npm run size` checks the configured JavaScript/CSS budgets after a build.

From VelvetUi: `npm run build` to check that the remaining component exports and dictionary shapes compile after extraction.

These commands remain unrun until authorized. Before release, check keyboard editing/selection/focus in virtual collections, saved-view import/export, English/Polish fallback, engine teardown and theme changes, polling completion after symbol/interval switches, old subscription errors after disposal and replacement of a candle with the same timestamp. No tests were changed as part of this migration.

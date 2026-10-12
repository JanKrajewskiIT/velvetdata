# Data component ownership

`DataGrid`, `ColumnManager`, `QueryBuilder`, `VirtualTable` and `VirtualList` now belong to VelvetData. Their implementations, controllers, styles, query model and saved-view helpers were moved from the sibling VelvetUi source. Low-level UI controls remain imported from `@jankrajewskiit/ui`; shared UI utilities stay in VelvetUi where its other components still use them.

Change these components' imports from `@jankrajewskiit/ui` to `@jankrajewskiit/data`. The same applies to their public types, `applyColumns`, `defaultGridView`, `reconcileGridView`, `parseGridView`, `serializeGridView`, `clearQuery`, `emptyQuery` and `describeQuery`. Import both packages' styles and compose `velvetDataMessages` with the existing provider. Migrate custom dictionary overrides from `velvet.data.{dataGrid,columnManager,virtualTable,virtualList}` and `velvet.patterns.queryBuilder` to `velvetData.{dataGrid,columnManager,virtualTable,virtualList,queryBuilder}`.

VelvetUi's reference files remain a historical design-system reference. They still contain the original data specimens; their presence is not a public UI export. The new ownership applies to `src` and package entry points. VelvetDemo still uses its published UI dependency and needs a separate dependency/import migration before consuming these local package revisions together. Do not release a UI revision that removes the exports while its consumers still import them.

## Saved views and collections

The moved grid retains one controlled/uncontrolled `GridViewState` for search, query, sort, column settings and widths. Its version-1 codec stores settings only, limits payload size/nesting/node counts and validates nested data before schema reconciliation. Server filtering/sorting and record persistence remain consumer-owned. Stable unique `rowKey` or `getRowId` values are necessary when records are replaced or reordered; positional fallback IDs cannot preserve identity across those operations. The current grid feature contracts were preserved; `ApplyColumns` is replaced by the canonical `applyColumns` name.

`Table` and its add-row slot remain in Velvet UI. The earlier VelvetData `DataGridPro`, flat query rule API, `TableAddRowAction`, `en`/`pl` exports and UI dictionary augmentation are replaced by the current component contracts and `velvetDataMessages`. This is a breaking rewrite of the previous VelvetData API and a breaking ownership change for VelvetUi. Package versions have not been bumped or published.

## Previous TradingView implementation

The deleted source contained `TradingViewChart`, private toolbar/metrics/overlay components and polling/WebSocket hooks. It bundled chart rendering, sample OHLC generation, interval changes, SMA20, EMA50, Bollinger Bands, RSI14, MACD and trend/level/zone drawing interactions in one component lifecycle. It also imported the previous Velvet UI provider and styling APIs, which no longer match the current UI source.

The new implementation composes current Velvet UI `Button`, `OptionSwitcher`, `Badge`, `EmptyState`, `Text` and `Table`. It separates chart UI, OHLC metrics, accessible records, indicator calculations, transport lifetime and an optional Lightweight Charts engine. The public contracts contain no Lightweight Charts types. The adapter follows the [Lightweight Charts API](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi).

The implemented scope includes candles, volume, configurable SMA/EMA periods, controlled interval selection, price levels, theme-aware rendering, keyboard pan/zoom/fit and polling/subscription feeds. Automatic sample generation, Bollinger Bands, RSI, MACD and interactive trend/zone drawing are not part of this revision. Consumers can extend the engine independently of Velvet UI. The former `liveFeed`, `drawings`, drawing-tool and third-party timestamp contracts do not have compatibility aliases.

## Required checks

Tooling follows VelvetUi's shared presets and compiler aliases; see [development tooling](../README.md#development-tooling). Copied reference styles retain VelvetUi's stylelint exclusion; new chart CSS Modules and owned extension styles remain checked.

From VelvetData: `npm install`, then `npm run verify`. Installation creates `node_modules` and a lockfile, contacts the configured package registry and runs `prepare` to initialize Husky hooks. Verification checks formatting, ESLint, Stylelint, the build and packed exports. Build creates `dist` and TypeScript build metadata; package verification creates a temporary package archive. `npm run size` checks the configured JavaScript/CSS budgets after a build.

From VelvetUi: `npm run build` to check that the remaining component exports and dictionary shapes compile after extraction.

These commands remain unrun until authorized. Before release, check keyboard editing/selection/focus in virtual collections, saved-view import/export, English/Polish fallback, engine teardown and theme changes, polling completion after symbol/interval switches, old subscription errors after disposal and replacement of a candle with the same timestamp. No tests were changed as part of this migration.

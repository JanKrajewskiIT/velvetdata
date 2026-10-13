# VelvetData

Advanced SolidJS data components published as `@jankrajewskiit/data`, composed from Velvet UI primitives, theme tokens and the shared i18n provider.

## Components

| Component          | Responsibility                                                                                                         | Example consumers                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `DataGrid`         | Editing, sorting, search, nested filters, selection, pinned/resizable columns, measured virtualization and saved views | Product catalog; market positions      |
| `ColumnManager`    | Column visibility, order and pin constraints                                                                           | Record grid; configurable report       |
| `QueryBuilder`     | Typed fields, nested AND/OR groups, operator restrictions and keyboard reordering                                      | Customer segments; transaction filters |
| `VirtualTable`     | Fixed-height row window and keyboard navigation                                                                        | Large audit dataset; market history    |
| `VirtualList`      | Fixed/known variable heights, selection and incremental loading                                                        | Search results; event stream           |
| `TradingViewChart` | Candles, volume, SMA/EMA, price levels, OHLC metrics and accessible data table                                         | Price history; market replay           |

The simple `Table`, `TableAddRowAction`, charts, calendars and presentation primitives remain in Velvet UI. Data requests, transport mapping, authorization, server pagination and application persistence belong to consumers.

## Use with Velvet UI

```tsx
import '@jankrajewskiit/ui/styles';
import '@jankrajewskiit/data/styles';
import { DataGrid, velvetDataMessages } from '@jankrajewskiit/data';
import { mountVelvetApp } from '@jankrajewskiit/ui';

await mountVelvetApp({
  root: 'root',
  messages: { en: [velvetDataMessages.en], pl: [velvetDataMessages.pl] },
  app: () => (
    <DataGrid
      rows={[{ id: 'one', name: 'Example', amount: 42 }]}
      columns={[
        { key: 'name', label: 'Name', editable: true },
        { key: 'amount', label: 'Amount', type: 'number' },
      ]}
      searchable
      columnManager
      viewSettings
      footer
    />
  ),
});
```

Compose `velvetDataMessages` into the existing Velvet provider. Missing messages fall back to bundled English. Share one instance of `solid-js` and `@jankrajewskiit/i18n` with Velvet UI. The package's messages use the `velvetData` namespace.

VelvetData requires Velvet UI `>=3.4.7 <4` and I18n `^3.4.2`. Its shared class, state, focus, id, width and row helpers import from `@jankrajewskiit/ui/common`; local copies have been removed. The `RowKey`, `RowSort` and `StaticTranslate` exports remain compatible through the shared types. Translation fallback uses UI's dictionary-neutral `createLibraryMessages` factory with the composed English UI/Data dictionary. Missing provider messages retain interpolation, plural rules and rich-text handlers through the shared I18n formatters.

Follow the [release order](docs/migration.md#release-order) when updating the shared packages. Dependency installation and resolved lockfile entries were confirmed against I18n 3.4.3 and UI/Data 3.4.8 on 2026-10-12; aggregate verification and browser interaction results must be recorded separately.

## Trading chart

The root entry point owns UI and engine-neutral types. `@jankrajewskiit/data/tradingview` is the optional Lightweight Charts adapter; only this import requires `lightweight-charts` 5.x. Consumers may instead supply their own `TradingChartEngineFactory`.

```tsx
import { TradingViewChart, type TradingViewChartPoint } from '@jankrajewskiit/data';
import { createLightweightTradingEngine } from '@jankrajewskiit/data/tradingview';

const bars: TradingViewChartPoint[] = [
  { time: 1720000000, open: 100, high: 105, low: 98, close: 103, volume: 1200 },
  { time: 1720000060, open: 103, high: 108, low: 102, close: 107, volume: 1500 },
];

<TradingViewChart
  symbol="EXAMPLE"
  data={bars}
  createEngine={createLightweightTradingEngine}
  levels={[{ id: 'reference', price: 100, label: 'Reference' }]}
/>;
```

Timestamps are Unix seconds in UTC. Static data must have ascending, unique timestamps and valid finite OHLC/volume values. The chart creates no sample records. Intervals are controlled: pass `interval`, `intervals` and `onIntervalChange`, then load the corresponding data. Changing symbol, interval or engine factory recreates the engine; ordinary data updates preserve its viewport. Positive/negative direction uses Velvet status tokens; indicator lines use its data-visualization tokens. Theme changes, resize and component disposal are handled by the adapter. Keyboard buttons provide pan, zoom and fit; the expandable native table provides the same price records without relying on a canvas or pointer.

SMA and EMA start after a full period; EMA is seeded from that first period's arithmetic mean. Default controls come from `DEFAULT_TRADING_INDICATORS`. `indicators` and `volume` support controlled ownership and callbacks; their `default*` props initialize local state. Price levels are consumer-controlled annotations, rendered by the engine.

## Live feeds

`useTradingViewPollingFeed` and `useTradingViewWsFeed` run under a Solid owner and start after mount. They return `data`, `status`, `error` accessors and `restart`. Transport parsing remains in the consumer. Both merge updates by timestamp, accept corrections/out-of-order incoming bars and retain at most `DEFAULT_TRADING_MAX_POINTS`. Changing `context().symbol`, `context().interval`, `enabled()` or calling `restart()` aborts the old run and resets the series from optional `initialData(context)`. Every old completion/event is ignored after invalidation, even if transport cancellation is unsupported.

```tsx
const feed = useTradingViewPollingFeed({
  context: () => ({ symbol: symbol(), interval: interval() }),
  poll: (context, signal) => marketClient.readBars(context, signal),
});

<TradingViewChart
  symbol={symbol()}
  interval={interval()}
  data={feed.data()}
  status={feed.status()}
  onRetry={feed.restart}
  createEngine={createLightweightTradingEngine}
/>;
```

Polling starts immediately and schedules the next request `DEFAULT_TRADING_POLL_INTERVAL_MS` after the previous response, without overlapping requests. An error stops polling until restart. A pending request has no library-imposed deadline; the consumer's client owns request timeouts and must honor the abort signal when possible. A subscription must return cleanup and report lifecycle through `onOpen`, `onData`, `onError`. A later successful event can recover a subscription's error state. Feed errors stay observable; raw transport errors are never rendered in the chart.

## Development tooling

Use Node 26, as in VelvetUi; `.nvmrc`, `.node-version`, package engines and CI agree on that version. ESLint, Stylelint, Prettier, TypeScript, Vite and the Husky pre-commit hook consume `@jankrajewskiit/configs`. Staged files use VelvetUi's chunked lint-staged tasks with its default stash and partial-staging protection. Reference CSS is excluded; owned CSS Modules retain the shared preset's naming rules, and extension styles use VelvetUi's `vui-block__element--modifier` convention.

The `typescript` dependency aliases `@typescript/typescript6` for tools importing the TypeScript JavaScript API, including typed ESLint and declaration generation. `@typescript/native` aliases TypeScript 7 for the compiler. The packages provide distinct binaries: `tsc6` for TypeScript 6 and `tsc` for TypeScript 7. Build and typecheck use `tsc`, matching VelvetUi. Preserve both npm aliases when updating dependencies so the config preset's TypeScript 6 peer remains compatible.

CI selects Node through `.nvmrc` and npm through `packageManager`. High/critical dependency advisories block verification except for the exact, expiring shared braces exception. Credentials are scoped to npm steps, and publishing targets GitHub Packages.

## Migration and verification

See [migration notes](docs/migration.md) for the breaking import/API changes and the previous chart capability inventory. The tooling gate checks formatting, lint, build, declarations and packed exports; a clean installation against the new package versions remains part of release verification. Keyboard/focus, hydration, provider fallback, theme changes, chart disposal and asynchronous race behavior require runtime verification. No interaction tests were added.

Run `npm install` to create the lockfile and initialize Husky, then `npm run verify` for formatting, ESLint, Stylelint, build and packed export checks. `npm run size` checks the bundle budgets after building. A new lockfile must be created before CI's `npm ci` step can run.

## Tooling gates

Configs 3.5 owns Vite plugins, staged-file chunking and the Velvet Stylelint naming preset. The consumer keeps its runtimes and stylesheet exclusions. The root ESLint override selects ESLint 10 for accessibility-plugin peers; the preset also adapts legacy rule APIs. `verify` runs formatting, ESLint, Stylelint, the build, package validation and size limits. The JavaScript budget covers all published `dist/**/*.mjs` modules compressed individually with Brotli (100 kB); it measures package output, not a tree-shaken application bundle or external peer dependencies.

## Shared configuration

Use Node 26 and the exact npm version from `packageManager`. Open `frontend.code-workspace` for TypeScript 7 and the shared formatter/linter setup. `verify` checks editor drift and enforces zero lint warnings. `audit:deps` is a separate networked dependency audit used by CI.

Published declarations are checked with `NodeNext` and `skipLibCheck: false`; package checks no longer ignore internal resolution errors. Vite libraries publish `.mjs` and `.d.mts`, while Reactive retains its valid TypeScript `NodeNext` `.js`/`.d.ts` output. Public package import paths stay the same.

See the [Configs release migration](https://github.com/JanKrajewskiIT/velvetconfigs/blob/v3.5.0/README.md#release-migration) for publication order, artifact-based workflows, the audit exception deadline and registry secrets. Refresh lockfiles and run `npm run verify` against the refreshed installation before publication.

## Security pipeline

Source verification includes Gitleaks, Semgrep, actionlint, zizmor and Trivy configuration scanning. npm audit blocks high/critical advisories under the shared expiring-exception policy. Verification produces a CycloneDX dependency SBOM. Weekly/manual security workflows re-check dependency databases and source history without building the application.

Knip is available through `npm run deps:check` (JSON report) and `npm run deps:strict` (blocking unused-code check). CI records the report while the initial findings are reviewed; security scans remain blocking. Public library entry exports are preserved.

Configure `CONFIGS_READ_TOKEN` for private Configs source access alongside the existing npm read token. See [shared security controls](https://github.com/JanKrajewskiIT/velvetconfigs/blob/v3.5.0/security/README.md) for required GitHub settings, reports, image signing, staging variables, WAF activation and manual acceptance checks.

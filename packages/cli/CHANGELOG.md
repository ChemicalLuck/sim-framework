# @chemicalluck/sim-cli

## 0.1.2

### Patch Changes

- 2fa7677: Pre-bundle react-router's CJS-only deps (`cookie`, `set-cookie-parser`) via
  `optimizeDeps.include` so games consuming the source-served engine don't crash with
  "doesn't provide an export named 'parse'".

## 0.1.1

### Patch Changes

- b5fd33c: Fix games rendering unstyled and crashing on load when consuming the engine.

  The engine ships as source and is excluded from Vite dep pre-bundling, which had
  two consequences for consuming games:
  - Its CJS-only deps were served raw, so the browser threw
    `doesn't provide an export named …` (e.g. react-redux's
    `useSyncExternalStoreWithSelector`, `redux-persist/lib/storage`'s default).
    The CLI now pre-bundles them via `optimizeDeps.include`, and dedupes
    `react`/`react-dom`/`react-redux` so a linked engine doesn't duplicate React.
  - Tailwind v4 skips `node_modules`, so none of the engine's utility classes were
    generated and the UI rendered unstyled. The engine now ships `styles.css`
    (an `@source` pointing at its own source); games import it with
    `@import '@chemicalluck/sim-engine/styles.css'`. The starter template does
    this by default.

- Updated dependencies [b5fd33c]
  - @chemicalluck/sim-engine@0.1.1

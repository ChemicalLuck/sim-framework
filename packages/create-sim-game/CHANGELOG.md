# @chemicalluck/create-sim-game

## 0.1.3

### Patch Changes

- d68825b: `tsconfig/game.json` no longer sets `include`, `baseUrl` or `paths`, which TypeScript
  resolved inside `node_modules` (so `tsc -p .` found no inputs). Set them in the game's
  own `tsconfig.json`, as the starter now does:
  `"compilerOptions": { "paths": { "~/*": ["./src/*"] } }, "include": ["src", "sim-env.d.ts"]`.
- cb68278: Upgrade react-router to v8. The engine now requires Node.js >=22.22.0 and React >=19.2.7
  (react-router 8's minimums). The CLI no longer pre-bundles `cookie` / `set-cookie-parser`,
  which react-router 8 dropped (its replacement deps are ESM); the starter template now
  depends on React ^19.2.7.
- a1372bb: Scaffolded games now depend on the framework versions released with the scaffolder
  (read from the workspace at build time) instead of a hardcoded `^0.1.0`, which would
  have kept new games on 0.1.x after the engine and CLI move to 0.2.
- 077d4bb: Fix a freshly scaffolded game crashing on load and in the editor: skip `contentSetup`
  calls for absent optional content extensions (e.g. `encounters.json`), let the Player
  Defaults panel handle a `player.json` without `bodyParts` / `initialItems` /
  `initialEquipment`, and ship the starter's missing data files. The shared ESLint preset
  now uses `defineConfig` so `extends` works under flat config.
- 531583c: The starter now ships `lint`, `typecheck` and `test` scripts, an `eslint.config.js`
  using the shared preset, an example content test, and the dev dependencies they need
  (`eslint`, `vite`, `vitest`, `jsdom`, Testing Library, `@types/react`,
  `@types/react-dom`).

## 0.1.2

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

## 0.1.1

### Patch Changes

- b2d8cd4: Fix scaffolding when the package is installed from npm. The template-copy filter
  rejected every path because the installed template lives under `node_modules`;
  it now tests paths relative to the template root, so `create-sim-game` copies
  the starter correctly.

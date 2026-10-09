# @chemicalluck/sim-engine

## 0.2.0

### Minor Changes

- 3928102: Gameplay and content fixes:
  - Conditions: an unrecognised bare identifier is now a parse error instead of a silent
    string; `sim check` and the editor flag stored conditions that compare a string with
    `<`/`>` or compare two literals. `season == '<id>'` and `weather == '<id>'` parse back
    into season/weather conditions, and the weather condition uses the game's RNG seed.
  - Relationships: metrics are clamped to a configurable range (`relationships.json`,
    default 0–100); new `relationship.<metric>` (current NPC) and
    `relationship.<npcId>.<metric>` condition expressions.
  - Scene and script actions respect their `condition`; set `lockedText` to show a locked
    action disabled instead of hiding it.
  - Scripts can declare `leave` to let the player end them early, with optional
    progress-scaled completion effects.
  - Needs: per-need `options` in `needs.json` for `direction: "inverse"`, `hideAtZero` and
    `thresholds` (effects when a need crosses a level). Needs now decay for all clock time
    an action advances.
  - `GameConfig.undoLimit` (0 disables undo) and `GameConfig.ironman`
    (`never` | `optional` | `always`): ironman runs have no undo and no manual save/load.

- cb68278: Upgrade react-router to v8. The engine now requires Node.js >=22.22.0 and React >=19.2.7
  (react-router 8's minimums). The CLI no longer pre-bundles `cookie` / `set-cookie-parser`,
  which react-router 8 dropped (its replacement deps are ESM); the starter template now
  depends on React ^19.2.7.

### Patch Changes

- 8f7eefa: Importing `RootState` (or the shared types) now brings every built-in feature's
  `PresentState`, effect, condition and content augmentations into a game's TypeScript
  program, so `state.present.time` and friends type correctly without importing each
  feature's slice.
- 811d46f: Engine subpath imports such as `@chemicalluck/sim-engine/features/npcs/types` now
  resolve in a game's TypeScript program (`moduleResolution: bundler`) without a `paths`
  workaround: the `./*` export lists `.ts`, `.tsx` and `index` candidates under the `types`
  condition.
- dea91af: Declare `@types/react` and `@types/react-dom` as peer dependencies. The engine ships
  `.tsx` source that a game typechecks, so without them every JSX expression types as an
  error.
- 077d4bb: Fix a freshly scaffolded game crashing on load and in the editor: skip `contentSetup`
  calls for absent optional content extensions (e.g. `encounters.json`), let the Player
  Defaults panel handle a `player.json` without `bodyParts` / `initialItems` /
  `initialEquipment`, and ship the starter's missing data files. The shared ESLint preset
  now uses `defineConfig` so `extends` works under flat config.

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

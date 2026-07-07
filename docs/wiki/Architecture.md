# Architecture

The defining constraint: **`@chemicalluck/engine` is game-agnostic and never imports game code.**
A game plugs in entirely at build time, through generated Vite virtual modules. This is
what lets one engine power many games and keeps games upgradable.

## Build-time discovery

The `sim` CLI runs two Vite plugins from the engine:

### `gamePlugin`
Scans the engine's `features/` and your `src/game/extensions/` by filename convention and
generates virtual modules:

- **`virtual:game-extensions`** — aggregates `slice.ts`, `effects.ts`, `post-effects.ts`,
  `effect-hydrators.ts`, `initializer.ts`, `views.tsx`, and (game-only) `actions.ts` into
  `slices`, `effectHandlers`, `postEffectHandlers`, `views`, `storeInitializers`,
  `actionGroupProviders`.
- **`virtual:game-setup`** — generates the `loadContent(...)` call that wires each
  `data/*.json` into the engine, driven by every feature's `feature.json` manifest
  (`content`, `contextSlots`, `contentExtensions`, `setup`, `contentSetup`).
- **`virtual:conditions`** — merges each feature's `conditions.ts` (evaluators, parsers,
  serializers) — the condition DSL vocabulary.
- **`virtual:references`** — merges each feature's `references.ts` (id sources, reference
  providers, rewriters) — powers `sim check` and the editor's integrity tools.

### `editorPlugin` (dev only)
Generates `virtual:editor-extensions` from `effect-editor.*` / `editor.*` files and serves
the [[Content Editor]] SPA plus its file-backed data API.

Because discovery is convention-based, adding a feature or a `data/*.json` file participates
automatically — no central registry to edit.

## Runtime

`main.tsx` renders `<GameEngine />`, which:

1. imports `virtual:game-extensions` and side-effect-imports `virtual:game-setup`;
2. registers effect handlers, builds the Redux store from the collected slices, runs store
   initializers;
3. merges views and picks the sidebar;
4. renders the view manager.

## Feature layout (engine internals)

Each engine feature under `@chemicalluck/engine/features/<name>/` follows the same layout as an
[[Extensions|extension]]: `slice.ts`, `selectors.ts`, `effects.ts`, `types.ts`,
`components/`, `lib/`, and a `feature.json` manifest declaring its content wiring. Features
and extensions are discovered by the same machinery — an extension is just a game-side
feature.

## Contribution model

Three engine subsystems are **open** and grow by contribution rather than a fixed list:

- **Effects** — `EffectMap` is an open interface; a feature/extension augments it and
  registers a handler in `effects.ts`.
- **Conditions** — `ConditionMap` / expression kinds; contributed via `conditions.ts`.
- **References** — id sources and reference providers contributed via `references.ts`, so
  validation and cascade-rename cover new content automatically.

## Distribution

`@chemicalluck/engine` ships as **TypeScript source** — your game's Vite process (via the CLI)
transpiles it. The engine's Node-side tooling (the two plugins) is compiled to JS so the
CLI can import it. The CLI aliases `@chemicalluck/engine` to the engine source directory so deep
imports and directory indexes resolve and the source is transformed normally.

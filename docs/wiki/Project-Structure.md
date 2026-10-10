# Project Structure

A game repo is small — almost everything is content. The engine, editor, and build
tooling come from dependencies.

```
my-game/
  package.json        # depends on @chemicalluck/sim-engine + sim (+ @chemicalluck/sim-config)
  tsconfig.json       # extends @chemicalluck/sim-config/tsconfig/game.json
  sim-env.d.ts        # references the engine's virtual-module types
  index.html          # loads /src/main.tsx
  sim.config.js       # optional build overrides (see [[CLI]])
  src/
    main.tsx          # renders <GameEngine />
    game/
      index.css       # Tailwind entry + theme
      data/*.json     # your world (see [[Authoring Content]])
      components/      # optional game-specific UI (e.g. a custom sidebar)
      extensions/      # optional custom features (see [[Extensions]])
```

## `src/main.tsx`

The entry point renders the engine. The default sidebar and views are used unless you
override them:

```tsx
import { GameEngine } from "@chemicalluck/sim-engine";
import "~/game/index.css";

createRoot(root).render(<GameEngine />);
```

`GameEngine` accepts a `config`:

```ts
interface GameConfig {
  sidebar?: React.ComponentType; // replace the default sidebar
  views?: ViewsRegistry; // register extra views
  persistTransforms?: Transform<unknown, unknown>[]; // redux-persist transforms
  undoLimit?: number; // Back-button undo steps (default 10, 0 disables)
  ironman?: "never" | "optional" | "always"; // ironman runs (default 'never')
  autosave?: { rotate: number }; // rotating `autosave` snapshots kept (default 3)
}
```

An ironman run has no undo or Back button and no manual save/load; the continuous
autosave is its only save. With `ironman: 'optional'` the player chooses it with a
checkbox at New Game; with `'always'` every run is ironman. The choice is stored with the
run and can't be changed mid-run. A custom sidebar can read it with
`selectIronman` / `selectUndoEnabled` from `@chemicalluck/sim-engine/features/save/selectors`.

`autosave.rotate` is how many snapshots made by the `autosave` effect are kept before the
oldest is dropped (checkpoints made with `"keep": true` don't count; `0` keeps only
checkpoints). Ironman runs, including every run under `ironman: 'always'`, make no
autosave snapshots.

```tsx
<GameEngine config={{ sidebar: MySidebar }} />
```

## Path aliases

- `~` → `./src` (your game code). Use `~/game/...`.
- `@chemicalluck/sim-engine` → the engine. Import runtime pieces from `@chemicalluck/sim-engine`, deep modules from
  `@chemicalluck/sim-engine/...` (e.g. `@chemicalluck/sim-engine/components/ui/button`).

## The `src/game/` rule

Keep all game-specific code under `src/game/`. The engine never imports it — your content
reaches the engine through build-time discovery (see [[Architecture]]). This separation is
the whole point: the same engine powers any game.

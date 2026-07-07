# sim game

A game built on the [sim](https://www.npmjs.com/package/sim) framework.

## Commands

```bash
npm run dev       # dev server — game at /, content editor at /editor
npm run build     # single self-contained dist/index.html
npm run check     # validate content references
npm run preview   # preview a production build
```

## Structure

```
src/
  main.tsx            # renders <GameEngine /> — swap in your own sidebar/views here
  game/
    index.css         # Tailwind + theme
    data/*.json       # your world: locations, items, scenes, needs, …
    extensions/       # (optional) self-contained feature slices
```

All gameplay lives in `src/game/`. The engine, editor, and build tooling come
from `@chemicalluck/sim-engine` and the `sim` CLI — you never configure Vite yourself.

Edit `src/game/data/*.json` to build your world, then run `npm run check` to
catch broken references. See the framework docs for the data formats and the
extension/effect system.

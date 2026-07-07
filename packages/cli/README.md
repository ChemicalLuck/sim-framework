# @chemicalluck/sim

The CLI for the **sim** game framework. Installs the `sim` binary and owns the build
config, so a game never manages its own `vite.config.ts`.

```bash
sim dev       # dev server — game at /, content editor at /editor
sim build     # single self-contained dist/index.html
sim editor    # dev server + prints the editor URL
sim preview   # preview a production build
sim check     # validate content references (CI-friendly exit code)
```

It resolves [`@chemicalluck/engine`](https://www.npmjs.com/package/@chemicalluck/engine)
from your project and assembles the Vite pipeline (React, Tailwind, the engine's
game/editor plugins, single-file build). Optional overrides go in a `sim.config.js`.

You normally get this wired up by scaffolding with
[`@chemicalluck/create-sim-game`](https://www.npmjs.com/package/@chemicalluck/create-sim-game).

📖 [Documentation](https://github.com/ChemicalLuck/sim-framework/wiki)

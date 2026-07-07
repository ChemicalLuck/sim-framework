# sim

**sim** is a framework for building browser-based life-simulation games. You write your
game as JSON content plus optional TypeScript extensions; the framework supplies the
runtime, a content editor, and the build tooling. A game compiles to a **single
self-contained HTML file**.

It is structured like a modern web framework: a game is its own repo that depends on
`@chemicalluck/sim-engine` and the `sim` CLI, the same way an app depends on a framework and its CLI.

## The pieces

| Package | Role |
| --- | --- |
| `@chemicalluck/sim-engine` | The game-agnostic runtime, the content editor, and the Vite plugins. Shipped as source. |
| `@chemicalluck/sim-cli` (CLI, bin `sim`) | `dev` / `build` / `editor` / `preview` / `check`. Owns the build config — your game has no `vite.config.ts`. |
| `@chemicalluck/create-sim-game` | Scaffolds a new game repo from the starter template. |
| `@chemicalluck/sim-config` | Shared TypeScript / ESLint / Prettier presets. |

## Start here

```bash
npm create @chemicalluck/sim-game my-game
cd my-game
npm install
npm run dev        # game at /, content editor at /editor
```

Then read **[[Getting Started]]**.

## Guide

- **[[Getting Started]]** — scaffold, run, build your first game.
- **[[CLI]]** — every `sim` command and `sim.config`.
- **[[Project Structure]]** — what lives in a game repo.
- **[[Authoring Content]]** — the `data/*.json` files, the effect & condition DSL.
- **[[Extensions]]** — add custom features (Redux slices, effects, views).
- **[[Content Editor]]** — the visual `/editor` app.
- **[[Architecture]]** — how the engine, plugins, and virtual modules fit together.

## Core idea: the engine never imports your game

The engine is strictly game-agnostic. It discovers your content and extensions at build
time through generated Vite **virtual modules** — it never imports `src/game/` directly.
That boundary is what lets one engine power many games. See **[[Architecture]]**.

# @sim/engine

The game-agnostic core of the **sim** framework: the React/Redux runtime, the content
editor, and the two Vite plugins (`game-plugin`, `editor-plugin`) that wire a game's content
and extensions into the engine at build time.

It is shipped as **TypeScript source** — the consuming game's Vite process (driven by the
`sim` CLI) transpiles it. You almost never depend on this package directly; scaffold a game
with `npm create sim-game` instead.

## Entry points

| Import | What |
| --- | --- |
| `@sim/engine` | `GameEngine`, `GameConfig` — the React root a game renders. |
| `@sim/engine/game-plugin` | `gamePlugin(options)` — Vite plugin, feature/extension auto-discovery. |
| `@sim/engine/editor/editor-plugin` | `editorPlugin(options)` — dev-only content editor server. |
| `@sim/engine/*` | Deep access to any engine module (features, lib, components, state, data, types). |

## Boundary rule

Engine code must never import game content. It reaches a game only through the four Vite
virtual modules the plugin generates: `virtual:game-extensions`, `virtual:game-setup`,
`virtual:conditions`, `virtual:references`.

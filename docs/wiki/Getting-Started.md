# Getting Started

## Requirements

- Node.js 20+
- npm, pnpm, or yarn

## Scaffold a game

```bash
npm create sim-game my-game
cd my-game
npm install
```

This creates a minimal but complete game — a couple of locations, an item, and all the
required content files — wired to `@sim/engine` and the `sim` CLI.

## Run it

```bash
npm run dev
```

- **`http://localhost:5173/`** — the game.
- **`http://localhost:5173/editor`** — the [[Content Editor]], a visual tool for editing
  your `data/*.json`. Changes save straight to disk and hot-reload.

## Build it

```bash
npm run build
```

Produces a single self-contained `dist/index.html` — no external assets, no server. Open
it directly or host it anywhere static.

## Validate content

```bash
npm run check
```

Scans your content for broken references (an effect pointing at an item id that doesn't
exist, a quest referencing a missing location, …) and exits non-zero if any are found —
useful in CI. See [[CLI]].

## What to edit

Everything gameplay-related lives in `src/game/` (see [[Project Structure]]):

- `src/game/data/*.json` — your world. Start with `locations.json`, `items.json`,
  `scenes.json`. See [[Authoring Content]].
- `src/game/extensions/` — optional custom features. See [[Extensions]].
- `src/main.tsx` — swap in your own sidebar or register extra views.

You do **not** manage a `vite.config.ts`, a Tailwind config, or the engine build — the
`sim` CLI owns all of that.

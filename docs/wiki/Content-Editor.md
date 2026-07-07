# Content Editor

The engine ships a visual content editor, served at **`/editor`** whenever you run
`sim dev` (or `sim editor`). It is a development tool only — it is never part of a
production build.

## What it does

- Browse and edit your `src/game/data/*.json` through forms instead of raw JSON.
- Edits **save straight to disk** (via the dev server's `/editor/api/data/:name` endpoint)
  and hot-reload the running game.
- Edit extension data at `/editor/api/extensions/:key`.
- Structured editors for effects and conditions, a template editor, global search, and
  referential-integrity tooling (cascade rename / delete) powered by the same
  `virtual:references` contributions as [[CLI|sim check]].

## Using it

```bash
npm run dev      # then open http://localhost:5173/editor
# or
npm run editor   # prints the editor URL
```

Because it writes to your real data files, keep the editor pointed at a working tree you
don't mind changing, and commit through git as usual.

## Extending it

Features and extensions can contribute editor UI by adding `effect-editor.{ts,tsx}` (for
effect forms) or `editor.{ts,tsx}` (for panels) files, discovered by the editor plugin. See
[[Architecture]] and [[Extensions]].

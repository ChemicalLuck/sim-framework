# CLI

The `sim` binary wraps Vite and the engine's plugins. Your game defines these scripts
(the starter does this for you):

```json
{
  "scripts": {
    "dev": "sim dev",
    "build": "sim build",
    "editor": "sim editor",
    "preview": "sim preview",
    "check": "sim check"
  }
}
```

## Commands

### `sim dev`
Starts the Vite dev server with HMR. Serves the game at `/` and the [[Content Editor]] at
`/editor`. The editor's data API (`/editor/api/*`) reads and writes your `data/*.json`.

### `sim build`
Produces a single self-contained `dist/index.html` via `vite-plugin-singlefile` — all JS
and CSS inlined, `console`/`debugger` stripped, CSS minified. No editor is included in the
production build.

### `sim editor`
Same as `sim dev`, but also prints the editor URL for convenience.

### `sim preview`
Serves a production build locally to sanity-check the single-file output.

### `sim check`
Validates content referential integrity — every reference in your data (item ids, location
ids, scene ids, …) must resolve to something that exists. Prints each issue as
`source: references unknown <kind> '<id>'` and exits non-zero if any are found. It also
warns about data files that are referenced but missing. Run it in CI.

## How it finds the engine

The CLI resolves `@chemicalluck/engine` from **your** project's `node_modules`, so a game always
builds against the engine version it depends on. Nothing is hard-coded to a global install.

## `sim.config.js` (optional)

Drop a `sim.config.js` (or `.mjs`) in your project root to extend the build. All fields are
optional:

```js
export default {
  // Extra Vite plugins, appended after the engine's.
  plugins: [],
  // Extra resolve aliases, merged over the defaults (`~` → ./src).
  alias: {},
  // Extra gamePlugin slot specs (advanced — custom convention files).
  extraSlots: [],
  // Arbitrary Vite InlineConfig, merged last.
  vite: {},
};
```

You never need a `vite.config.ts` — the CLI assembles the full Vite config (React, Tailwind,
the game plugin, the editor plugin, single-file build) for you.

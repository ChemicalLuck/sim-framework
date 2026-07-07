# Extensions

An extension is a self-contained vertical feature slice under
`src/game/extensions/<name>/`. It can add Redux state, effect kinds, actions, views, an
editor panel, and content — without modifying the engine. Extensions are auto-discovered by
filename convention; there is no registration step.

## File layout

```
extensions/<name>/
  types.ts        # domain types + ALL module augmentations for this extension
  slice.ts        # Redux reducer (createSlice); default export, keyed by folder name
  selectors.ts    # derived state
  effects.ts      # default export: { <kind>: handler } → merged into effect handlers
  actions.ts      # default export: [(locationId, state) => ActionGroup[]] providers
  post-effects.ts # optional side-effects (toasts, analytics)
  data.ts         # registers content (exports `${name}Data`)
  data.json       # extension content
  views.tsx       # view components → merged into the view registry
  editor.tsx      # optional editor panel
  components/      # feature UI
  lib/            # pure logic + tests
  feature.json    # only for non-standard content wiring
```

Only include the files you need. A UI-only extension might have just `slice.ts`,
`selectors.ts`, and `components/`.

## Extending the engine via module augmentation

Everything an extension adds to engine-owned maps goes through TypeScript module
augmentation, conventionally in `types.ts`:

```ts
// A new effect kind
declare module '@sim/engine/types/effect.types' {
  interface EffectMap { education: EducationEffect; }
}

// Hydrated content available on the loaded Content object
declare module '@sim/engine/data' {
  interface ContentExtensions { education: { courses: Course[] }; }
}
```

## The moving parts

- **`slice.ts`** — `export default createSlice({ name: 'education', ... }).reducer`. The
  plugin keys it into the store by folder name.
- **`effects.ts`** — `export default { education: handleEducationEffect }`. Data actions can
  now use `{ "kind": "education", ... }`.
- **`actions.ts`** — `export default [(locationId, state) => ActionGroup[]]`. Contributes
  context-aware actions (e.g. location- and time-gated) whose effects reference your kind
  plus engine kinds.
- **`data.ts`** — `export const educationData = { key: 'education', data: raw, hydrate }`.
  The plugin imports it as `${name}Data` and wires it into content loading.
- **`views.tsx`** — export view components; they merge into the view registry and can be
  targeted by a `{ "kind": "view", "activeViewId": "..." }` effect.

## Registering extra views without an extension

For one-off views you can skip the extension folder and pass them via `GameConfig.views` in
`main.tsx` (see [[Project Structure]]).

See the **effect / condition / reference contribution** details in [[Architecture]].

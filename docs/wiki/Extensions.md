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
  template-vars.ts # default export: (state) => { key: value }; optional `keys` list
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

The folder name need not be a JS identifier: `my-ext/` works, and everything keyed by
name (store slice, `{my-ext.<key>}` template variables, …) uses `my-ext` as is. Only
`data.ts` must export a camel-cased name: `myExtData`.

## Extending the engine via module augmentation

Everything an extension adds to engine-owned maps goes through TypeScript module
augmentation, conventionally in `types.ts`:

```ts
// A new effect kind
declare module "@chemicalluck/sim-engine/types/effect.types" {
  interface EffectMap {
    education: EducationEffect;
  }
}

// Hydrated content available on the loaded Content object
declare module "@chemicalluck/sim-engine/data" {
  interface ContentExtensions {
    education: { courses: Course[] };
  }
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
- **`template-vars.ts`** — `export default (state) => Record<string, string | number | boolean>`.
  Each key is exposed to text templates (location descriptions, scenes, scripts,
  conversations, the player's appearance description, …) namespaced by folder name, so `education/template-vars.ts` returning
  `{ term: 'autumn', examWeek: true }` gives `{education.term}` and
  `{if education.term == 'autumn'}…{/if}`. `true` renders as `true`; `false` counts as
  unset, so `{if education.examWeek}` works as a flag. The provider runs on every state
  change, so keep it cheap. Type it with `TemplateVarProvider` from
  `@chemicalluck/sim-engine/features/linguistics/lib/extension-vars`:

  ```ts
  import type { TemplateVarProvider } from "@chemicalluck/sim-engine/features/linguistics/lib/extension-vars";

  const templateVars: TemplateVarProvider = (state) => ({
    term: state.present.education.term,
  });
  export default templateVars;
  ```

  The editor's template linter cannot run the provider, so also export the keys it
  returns: `export const keys = ['term', 'examWeek'];`. The linter then accepts
  `{education.term}` and still flags `{education.typo}`. Without `keys` it accepts any
  `{education.<key>}`.

## Registering extra views without an extension

For one-off views you can skip the extension folder and pass them via `GameConfig.views` in
`main.tsx` (see [[Project Structure]]).

See the **effect / condition / reference contribution** details in [[Architecture]].

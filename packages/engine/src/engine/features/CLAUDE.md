# Engine Features

Each subdirectory is a self-contained feature module auto-discovered by `game-plugin.ts`. Features live in `src/engine/features/<name>/` and follow a consistent file layout.

## Feature Index

| Feature         | What it manages                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| `calendar`      | Scheduled events (work, social, extension categories like `lecture`)                  |
| `clothing`      | Clothing state: wet, dirty, wear-time tracking                                        |
| `containers`    | Storage containers — deposit/withdraw inventory items                                 |
| `core`          | Base items and wearables; hydrates `items.json` and related content                   |
| `encounter`     | Turn-based NPC encounter system (actions, transitions, NPC selection)                 |
| `events`        | Random events — probabilistic triggers on action execution, loaded from `events.json` |
| `milestones`    | One-shot achievement/milestone tracking                                               |
| `minimap`       | Minimap metadata and rendering data                                                   |
| `money`         | Currency balance — delta effects add or subtract                                      |
| `needs`         | Player needs (hunger, energy, etc.) — delta effects per need                          |
| `npcs`          | NPC characters, pronouns, relationships, nearby NPC state                             |
| `outfits`       | Named outfit presets (saved equipment sets)                                           |
| `player`        | Player character, location, inventory, equipped wearables                             |
| `quests`        | Quest and objective state (locked → available → complete)                             |
| `relationships` | NPC relationship metrics: Friendship, Romance, Attraction                             |
| `rng`           | Seeded RNG for reproducible randomness across all features                            |
| `save`          | Save/load game state to localStorage                                                  |
| `shop`          | Shop UI — tabs of purchasable items and wearables                                     |
| `time`          | In-game clock, advances via `time` effects (hours + minutes)                          |
| `travel`        | World graph navigation (walk, bus, train, drive)                                      |
| `view`          | Active view ID + props — drives what the UI renders                                   |
| `weather`       | Season and weather condition simulation                                               |

## Standard File Layout

```
feature/
  types.ts             # Feature-specific types + EffectMap/ConditionMap augmentations
  slice.ts             # Redux reducer + actions (createSlice)
  slice.test.ts
  selectors.ts         # createSelector-based derived state
  selectors.test.ts
  effects.ts           # Effect-kind handlers, keyed by kind string
  post-effects.ts      # Side-effects after main handlers (toasts, analytics) — optional
  conditions.ts        # Condition/Expr types when feature adds condition kinds — optional
  references.ts        # Reference contributions (id sources / providers / extractors) — optional
  effect-editor.tsx    # Inline editor for this effect kind — optional
  editor.tsx           # Full editor panel — optional
  editor.test.tsx
  components/          # Feature UI components
  lib/                 # Pure business logic (tested independently)
  feature.json         # Plugin manifest
```

Not every file is present in every feature. The mandatory minimum is `slice.ts` (or at least `types.ts`).

## Adding a New Engine Feature

1. Create `src/engine/features/<name>/` with the files you need.
2. Add `feature.json` if the feature loads content, contributes virtual module exports, or needs setup callbacks (see `game-plugin.ts` `DEFAULT_SLOTS` for the full list of auto-discovered filenames).
3. If the feature adds a new effect kind, augment `EffectMap` in `types.ts`:
   ```ts
   declare module '~/engine/types/effect.types' {
     interface EffectMap {
       myKind: MyEffect;
     }
   }
   ```
4. Register the effect handler in `effects.ts` (exported as `export default { myKind: handler }`).
5. No manual registration elsewhere — `game-plugin.ts` picks up the files automatically.

## Reference Validation (`references.ts`)

Editor validation and "referenced-by"/cascade-delete are **feature-contributed**, not centralised. A feature exports any of three named arrays from `references.ts`; the `game-plugin.ts` bundles them into `virtual:references`, consumed by both the editor and `data-integrity.test.ts`. Engine logic lives in `~/engine/lib/validation`.

- `idSources: IdSource[]` — namespaces this feature is the source of truth for (`{ namespace, file, select }`).
- `referenceProviders: ReferenceProvider[]` — content files this feature owns that hold references (`{ file, section, collect }`); use `collectActionGroupRefs`/`collectEffectRefs` for action-shaped content.
- `nodeRefExtractors: NodeRefExtractor[]` — for each effect/condition kind the feature owns, the references it makes (`(node) => ContentRef[]`).

Use the feature's real authoring types — do **not** define structural `Raw*` copies of data shapes. Adding a feature, effect kind, or data file participates in validation automatically with no central edits.

## Import Rules

Features may import from:

- `~/engine/lib/` — pure utilities
- `~/engine/types/` — shared type definitions
- `~/engine/state/` — Redux store and typed hooks
- Other `~/engine/features/<name>/` — cross-feature imports are allowed but keep them minimal

Features must **never** import from `~/game/`. Engine code is game-agnostic.

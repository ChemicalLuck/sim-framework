# @chemicalluck/sim-engine

## 0.4.0

### Minor Changes

- 11a777e: Make the game screens work on phones (below 768px):
  - A sticky top bar on every sidebar view shows the weather, the clock, the wallet and a thin bar per need.
  - The sidebar becomes a bottom sheet. To open it, tap or swipe up the "Menu" tab pinned to the bottom edge. To close it, swipe its grab handle down. Before this, the sidebar could not be opened on a phone at all.
  - The minimap is collapsed behind a "Show map" toggle. When open, it scrolls sideways at a readable size and is centred on the player.
  - Dialogs open full screen with a large close button.
  - The page drops its card frame and wide padding.
  - Actions are full-width rows at least 44px tall, without keyboard-number hints.

  On phones the sheet shows actions only. Wrap stats in the new `DesktopOnly` to skip them there, since the top bar already shows them.

  Adds `DesktopOnly`, `useOptionalSidebar` and `useVerticalSwipe`.

## 0.3.0

### Minor Changes

- 99f20f0: Add an `autosave` effect that keeps rotating autosave snapshots (configurable with `autosave: { rotate }`) and permanent `keep` checkpoints, listed separately in the save/load dialog and disabled in ironman runs.
- 798d0c3: Allow calendar events on any day of the week (`dayOfWeek` 0 = Sunday … 6 = Saturday); weekend events now show as upcoming.
- dae324b: Add `actor` (`player | npc | both`) to encounter actions and actor-aware encounter conditions: `self.skill.<id>`, `self.need.<id>`, `npc.skill.<id>`, `npc.need.<id>` and `npc.relationship.<metric>`.
- 41864fa: Support several NPCs per encounter: `npcIds` on the encounter effect, per-NPC needs and picks (optional `npcTurnOrder`), slotted `npcNeed.<slot>.*` / `npc.<slot>.*` conditions, action `target` slots, per-NPC view rows, and NPCs leaving while the rest carry on.
- 2ea3634: Let encounters end without the player: `stopCondition` on encounters and states, NPC `npcStop` actions, and `stopEffectsByReason` keyed by `player | npc | condition`.
- 897fe1c: Let game extensions supply template variables via a `template-vars.ts` provider, exposed as `{<extension>.<key>}` in text templates.
- 717cca7: Add `gameweekday`, `gameday`, `gamemonth` and `nearby` condition ids, and read the game clock in UTC so hours, weekdays and seasons no longer depend on the host's timezone.
- ba6c496: Weather now varies hour by hour (seeded intra-day spells and a daily temperature curve) and its need drain applies to all elapsed time, including sleep at a reduced rate.
- 19fa973: Let the template linter accept extension template variables: `template-vars.ts` may export a `keys` list, and extensions without one accept any `{<extension>.<key>}`.
- 6ea120e: Support multiple minimaps (`maps` with per-map `nodes`, `zones` and `viewBox`) that switch with the player's region, and skip edges whose endpoints aren't on the map instead of crashing.
- 4a4e819: `sim check` and the editor flag needs not declared in `needs.json` when named in `clothingNeeds`, a `needs` effect or a `need.<Name>` condition.
- d2f5dc2: Make `quests.json` optional: a game without it loads with no quests.
- 7a68cef: Fix quest objectives: action objectives with their own effects now complete, `onComplete` fires on every completion path, scene objectives complete when a choice is taken in their scene, partly done quests are no longer listed as completed, and `quests.json` is hydrated, resolving shorthand effects and `{ kind: "scene", sceneId }` objectives.
- 378e251: Scripts can end early on an `endCondition` (running completion or leave effects per `endWith`), keep their `increment`, run each scene's `completionEffects`, resolve scene references in any file order, and restart at step 0 when a new script is shown.
- 404710f: Shops support a `priceMultiplier`, per-entry `price` overrides, and `condition`/`lockedText` on tabs and entries.
- be5934b: Add optional templated `lockedText` to locations and edges so travel options whose condition fails show as disabled with a reason instead of being hidden; parent travel now respects the parent's condition.
- b2b9e65: Add `skillMax` to `player.json` (default 10) as the single skill scale for the player skill clamp, NPC skill generation defaults and encounter skill weighting.
- 8b74eb7: `wearable_condition` can set wet, dirty and wear time and run silently; clothing need names and drain rates are configurable via `clothingNeeds` in `wearables-config.json`, and the hygiene drain now counts items that became dirty in the same update.
- 53871dd: Wearable templates and wearables carry `warmth` and custom `attributes`; `selectEquippedAttributeTotal` and the `equipped.<attr>` condition sum them across equipped clothing.
- 365c38f: Weather conditions define their need drains (`needEffects`) and clothing wetting (`wetsClothing`), so conditions added or overridden in `weather.json` drain needs and wet clothing.
- 3c492dc: Optional `weather.json` sets per-season condition weights, day-to-day persistence and condition overrides/additions; a season change now drifts to the most similar condition instead of the first in the pool.
- 9cab0e6: `sim check` and the editor flag needs not declared in `needs.json` when named in a `weather.json` condition's `needEffects`, or in `needs.json`'s `decayRates`, `options` or `sleepRestoreNeed`.
- 2c72f6a: The `weather` effect accepts `durationHours` or `until` to make the override expire with game time, and `temperature` to override the reported temperature.

### Patch Changes

- 70b8940: `sim check` only warns about missing data files that feature manifests declare required, not absent optional ones such as `weather.json`.
- a6885c1: Stop reporting plain references from reference providers (minimap nodes, shop entries, the player start location, edges) as condition issues in `sim check`.
- dcb1d60: The editor tolerates absent optional data files (quests.json, events.json, …): their panels open empty and saving creates them, global search, effect data and rename skip them, missing required files are listed under problems, and the dev data server answers 404 only for a missing file (500 with the message for other read errors).
- 5a9402c: The editor's reference validation skips content files the game doesn't have (e.g. an optional `weather.json`) instead of failing, while still surfacing real read and parse errors.
- 54d0052: Generate valid, unique import identifiers in the game and editor virtual modules for feature and extension folder names that are not JS identifiers (e.g. `my-ext`), keeping the real folder names as keys.
- bc06e39: Hydrate `quest-templates.json` like `quests.json`, so shorthand effects (e.g. `{ kind: "view", sceneId }`) and `{ kind: "scene", sceneId }` objectives in quest templates are resolved.
- e13919d: Save and undo the world RNG's sequence position (not just the seed) and draw encounter NPC picks from a seeded sub-stream, so random outcomes after a load or undo match an uninterrupted session.
- 92c07bf: Render the player's appearance description with extension template variables too, via a shared `selectTemplateVars` selector.
- e415449: Edit quest objective action triggers as actions in the quests and quest templates editors, and let authors choose a condition or action trigger.
- 469822f: Unlock quest objectives with an action `trigger`: a locked objective becomes available once the trigger action's own condition holds, after which the action is offered and taking it completes the objective.
- 40673ae: Edit action and scene quest objectives as actions and scenes in the quest and quest template editors, instead of replacing them with a condition.
- d08c907: Check and rename references inside quest objective actions, inline scenes and `onComplete` effects, and in the `completionEffects` of scenes inside scripts.
- 92b3070: Warn about a quest template ID Template only when it has no `{npc0…}` token, instead of whenever it lacks `{{`.
- ef8826c: Treat quest ids (and their objectives) that a quest template's `idTemplate` produces, such as `meet_ann` from `meet_{npc0.id}`, as known in reference checks instead of reporting them as unknown quests.
- ef8e63a: Fill `{npc0.id}` with the NPC's id when a quest template is instantiated.
- 3724c5d: Fill `{npc0…}` placeholders in a quest template objective's `trigger` and `condition` when the template is instantiated.
- 4a7c288: Check and rename references inside `quest-templates.json`, skipping ids that hold `{npc0…}` placeholders.
- af96eb9: Restore the whole saved game on reload and when loading a save slot, instead of resetting every slice except NPCs and RNG to its initial state.
- fa65c44: Edit the `completionEffects` of each scene in the script editor.
- 9f899d8: Derive procedural NPC ids from the seed and generation index so they stay the same across reloads and relationships with them are no longer orphaned.

## 0.2.0

### Minor Changes

- 3928102: Gameplay and content fixes:
  - Conditions: an unrecognised bare identifier is now a parse error instead of a silent
    string; `sim check` and the editor flag stored conditions that compare a string with
    `<`/`>` or compare two literals. `season == '<id>'` and `weather == '<id>'` parse back
    into season/weather conditions, and the weather condition uses the game's RNG seed.
  - Relationships: metrics are clamped to a configurable range (`relationships.json`,
    default 0–100); new `relationship.<metric>` (current NPC) and
    `relationship.<npcId>.<metric>` condition expressions.
  - Scene and script actions respect their `condition`; set `lockedText` to show a locked
    action disabled instead of hiding it.
  - Scripts can declare `leave` to let the player end them early, with optional
    progress-scaled completion effects.
  - Needs: per-need `options` in `needs.json` for `direction: "inverse"`, `hideAtZero` and
    `thresholds` (effects when a need crosses a level). Needs now decay for all clock time
    an action advances.
  - `GameConfig.undoLimit` (0 disables undo) and `GameConfig.ironman`
    (`never` | `optional` | `always`): ironman runs have no undo and no manual save/load.

- cb68278: Upgrade react-router to v8. The engine now requires Node.js >=22.22.0 and React >=19.2.7
  (react-router 8's minimums). The CLI no longer pre-bundles `cookie` / `set-cookie-parser`,
  which react-router 8 dropped (its replacement deps are ESM); the starter template now
  depends on React ^19.2.7.

### Patch Changes

- 8f7eefa: Importing `RootState` (or the shared types) now brings every built-in feature's
  `PresentState`, effect, condition and content augmentations into a game's TypeScript
  program, so `state.present.time` and friends type correctly without importing each
  feature's slice.
- 811d46f: Engine subpath imports such as `@chemicalluck/sim-engine/features/npcs/types` now
  resolve in a game's TypeScript program (`moduleResolution: bundler`) without a `paths`
  workaround: the `./*` export lists `.ts`, `.tsx` and `index` candidates under the `types`
  condition.
- dea91af: Declare `@types/react` and `@types/react-dom` as peer dependencies. The engine ships
  `.tsx` source that a game typechecks, so without them every JSX expression types as an
  error.
- 077d4bb: Fix a freshly scaffolded game crashing on load and in the editor: skip `contentSetup`
  calls for absent optional content extensions (e.g. `encounters.json`), let the Player
  Defaults panel handle a `player.json` without `bodyParts` / `initialItems` /
  `initialEquipment`, and ship the starter's missing data files. The shared ESLint preset
  now uses `defineConfig` so `extends` works under flat config.

## 0.1.1

### Patch Changes

- b5fd33c: Fix games rendering unstyled and crashing on load when consuming the engine.

  The engine ships as source and is excluded from Vite dep pre-bundling, which had
  two consequences for consuming games:
  - Its CJS-only deps were served raw, so the browser threw
    `doesn't provide an export named …` (e.g. react-redux's
    `useSyncExternalStoreWithSelector`, `redux-persist/lib/storage`'s default).
    The CLI now pre-bundles them via `optimizeDeps.include`, and dedupes
    `react`/`react-dom`/`react-redux` so a linked engine doesn't duplicate React.
  - Tailwind v4 skips `node_modules`, so none of the engine's utility classes were
    generated and the UI rendered unstyled. The engine now ships `styles.css`
    (an `@source` pointing at its own source); games import it with
    `@import '@chemicalluck/sim-engine/styles.css'`. The starter template does
    this by default.

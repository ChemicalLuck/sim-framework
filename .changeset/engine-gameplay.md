---
"@chemicalluck/sim-engine": minor
---

Gameplay and content fixes:

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

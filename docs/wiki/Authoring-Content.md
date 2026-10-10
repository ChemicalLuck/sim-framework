# Authoring Content

All content is JSON under `src/game/data/`. The engine loads and validates it at build
time. Every content object carries a `kind` discriminant (`"scene"`, `"item"`,
`"action"`, …).

Run [[CLI|sim check]] after edits to catch broken references.

## Data files

Each engine feature declares which files it consumes. Files marked **optional** can be
omitted or left as an empty `[]` / `{}`.

| File                                   | Purpose                                                                  | Required         |
| -------------------------------------- | ------------------------------------------------------------------------ | ---------------- |
| `locations.json`                       | Places in the world                                                      | ✅               |
| `edges.json`                           | Travel connections between locations                                     | ✅               |
| `minimap.json`                         | Minimap node positions & zones                                           | ✅               |
| `items.json`                           | Inventory items + their actions                                          | ✅               |
| `scenes.json`                          | Scripted scenes (text + actions)                                         | ✅               |
| `scripts.json`                         | Timed multi-step scripts                                                 | ✅               |
| `wearable-templates.json`              | Clothing templates                                                       | ✅ (may be `[]`) |
| `wearables-config.json`                | Slots, categories, sizing                                                | ✅               |
| `player.json`                          | Starting player state                                                    | ✅               |
| `needs.json`                           | Needs & decay rates                                                      | ✅               |
| `currency.json` / `initial-money.json` | Money setup                                                              | ✅               |
| `time.json`                            | Game start timestamp (ISO string; without an offset it is read as UTC)   | ✅               |
| `names.json`                           | Random NPC name pools                                                    | ✅               |
| `professions.json`                     | NPC professions                                                          | ✅               |
| `quests.json`                          | Quests & objectives                                                      | ✅ (may be `[]`) |
| `milestones.json`                      | Milestones                                                               | ✅ (may be `[]`) |
| `shops.json`                           | Shops & stock                                                            | ✅ (may be `[]`) |
| `appearance.json`                      | Body/appearance attributes                                               | optional         |
| `skills.json`                          | Player skills                                                            | optional         |
| `conversations.json`                   | NPC conversation topics                                                  | optional         |
| `named-npcs.json`                      | Hand-authored NPCs                                                       | optional         |
| `encounters.json`                      | Random encounters                                                        | optional         |
| `events.json`                          | World events                                                             | optional         |
| `quest-templates.json`                 | Reusable quest templates                                                 | optional         |
| `linguistics.json`                     | Text macros & terms                                                      | optional         |
| `relationships.json`                   | Relationship metric range, e.g. `{ "min": 0, "max": 100 }` (the default) | optional         |

## Minimap

`minimap.json` holds one map (top-level `nodes`, `zones`, optional `viewBox`, default
`"0 0 640 200"`) or several under `maps`. The minimap shows the map containing the
player's nearest ancestor location placed as a node, so it switches as the player
travels between regions. `locationMaps` pins a location (and its children) that has no
node to a map. Edges whose endpoints are not both on the shown map are not drawn.

```json
{
  "maps": {
    "town": { "nodes": { "home": { "x": 40, "y": 60, "label": "Home" } } },
    "coast": {
      "nodes": { "harbour": { "x": 20, "y": 20, "label": "Harbour" } },
      "zones": [
        { "label": "DOCKS", "x": 0, "y": 0, "width": 100, "height": 50 }
      ],
      "viewBox": "0 0 100 50"
    }
  },
  "locationMaps": { "ferry": "coast" }
}
```

## Effects

Actions apply **effects** — the only way player actions change state. Each effect has a
`kind`. Common built-ins:

```json
{ "kind": "needs", "need": "Energy", "delta": 20 }
{ "kind": "inventory", "operation": "remove", "id": "coffee" }
{ "kind": "money", "amount": -5 }
{ "kind": "sleep", "wakeTime": 7 }
{ "kind": "view", "activeViewId": "DefaultView", "props": {} }
```

An item that restores energy and is consumed:

```json
{
  "kind": "item",
  "id": "coffee",
  "name": "Coffee",
  "value": 2,
  "description": "A hot cup of coffee.",
  "actions": [
    {
      "actions": [
        {
          "kind": "action",
          "text": "Drink the coffee",
          "effects": [
            { "kind": "needs", "need": "Energy", "delta": 20 },
            { "kind": "inventory", "operation": "remove", "id": "coffee" }
          ]
        }
      ]
    }
  ]
}
```

Extensions can add their own effect kinds — see [[Extensions]].

### Autosaves

`autosave` snapshots the game into an autosave slot, listed under **Autosaves** in the
Save / Load dialog and loaded like a manual save:

```json
{ "kind": "autosave", "label": "Woke up" }
{ "kind": "autosave", "label": "Chapter 2", "keep": true }
```

The snapshot is taken after the rest of the action's effects apply. Only the newest
rotating autosaves are kept (3 by default, set with the `autosave: { rotate }` game
config — see [[Project-Structure]]); `"keep": true` makes a permanent checkpoint that is
never rotated out. Ironman runs make no autosave snapshots: their continuous autosave
stays the only save.

## Needs

`needs.json` sets each need's starting value and decay rate (points per hour the value
falls; a negative rate makes it rise). Needs decay for all clock time an action advances.
Optional per-need `options`:

```json
{
  "needs": { "Energy": 100, "Intoxication": 0 },
  "decayRates": { "Energy": 5, "Intoxication": 8 },
  "options": {
    "Intoxication": {
      "direction": "inverse",
      "hideAtZero": true,
      "thresholds": [
        { "at": 100, "effects": [{ "kind": "view", "sceneId": "passed_out" }] }
      ]
    }
  }
}
```

- `direction`: `normal` (bad at 0, the default) or `inverse` (bad at 100). It sets the
  display colours, and sleep slows only changes toward the bad end.
- `hideAtZero`: hide the need in the sidebar while it is 0.
- `thresholds`: effects applied when the need crosses `at` toward its bad end (or the
  direction given by `"when": "rising" | "falling"`), including reaching 0 or 100.

## Scripts

A script plays its scenes in order (or randomly), one per action, advancing time each
turn, then applies `completionEffects`. Add `leave` to let the player end it early:

```json
"leave": { "text": "Clock out", "effects": [], "scaleCompletionEffects": true }
```

The leave action appears on every scene. It applies `leave.effects` and, with
`scaleCompletionEffects`, the completion effects with each numeric `delta`/`amount` scaled
by the fraction of scenes completed. It returns to the default view unless one of those
effects changes the view. Time already spent stays spent; leaving adds none.

## Conditions

Actions and objectives can be gated by **conditions**, an expression DSL with a `kind`:

```json
{
  "kind": "eq",
  "lhs": { "kind": "location" },
  "rhs": { "kind": "string", "value": "kitchen" }
}
```

An action whose condition isn't met is hidden, wherever it appears (locations, scenes,
scripts, items, …). Set `"lockedText": "Requires Charm 3"` on the action to show it
disabled with that text instead.

Locations (`locations.json`) and edges (`edges.json`) work the same way for travel: a
location or edge whose `condition` fails is hidden from travel, unless it sets
`lockedText`, in which case the travel button is shown disabled with that reason. This
applies to child, parent and edge destinations alike. `lockedText` is template text, so
it can use variables such as `{hour}`:

```json
{
  "id": "bakery",
  "name": "Bakery",
  "kind": "interior",
  "parent": "high_street",
  "condition": {
    "kind": "gte",
    "lhs": { "kind": "gamehour" },
    "rhs": { "kind": "const", "value": 7 }
  },
  "lockedText": "Opens at 7:00 (it's {hour}:00)"
}
```

Combine with `and` / `or` / `not`. Expression nodes (`location`, `string`, `time`, need
levels, …) are contributed by features, so the available vocabulary grows with the engine.

The editor writes these from a string DSL, e.g. `money >= 50 && gamehour < 20`. Built-in
identifiers include `money`, `need.<Name>`, `skill.<id>`, `location`, `gametime`,
`gamehour`, `gameweekday` (0 = Sunday … 6 = Saturday), `gameday` (1–31), `gamemonth`
(1–12), `nearby` (number of NPCs at the current location), `relationship.<metric>` (the
current NPC in a scene, script, NPC view or encounter), `relationship.<npcId>.<metric>`,
`milestone.<id>`, `season == '<id>'` and `weather == '<id>'`. The game clock is read in
UTC, so hours, weekdays and seasons are the same on every machine; ISO date literals
without an offset (`gametime >= '2025-09-01T08:00'`) are game time too.
An unrecognised bare identifier is a parse error; quote string
literals. `sim check` also flags stored conditions that compare a string with `<`/`>` or
compare two literals, both signs of a mistyped identifier.

## Referential integrity

References between files (an item id in a shop, a location id in a quest) are checked by
`sim check`. Broken references are reported as
`source: references unknown <namespace> '<id>'`. The check is contribution-driven — adding a
feature or file participates automatically.

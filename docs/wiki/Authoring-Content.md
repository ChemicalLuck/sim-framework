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
| `weather.json`                         | Weather frequencies, persistence & conditions — see [Weather](#weather)  | optional         |

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

A `calendar` effect schedules a weekly event; `dayOfWeek` is 0 = Sunday, 1 = Monday …
6 = Saturday (the same numbering as the `gameweekday` condition):

```json
{
  "kind": "calendar",
  "operation": "add",
  "event": {
    "id": "football",
    "label": "Football practice",
    "category": "social",
    "dayOfWeek": 6,
    "hour": 10,
    "durationMinutes": 90
  }
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

## Clothing

Worn clothing tracks wet, dirty and wear time. The `wearable_condition` effect changes it
for a wearable id (or `"*"` for every wearable the player owns):

```json
{ "kind": "wearable_condition", "target": "*" }
{ "kind": "wearable_condition", "target": "shirt", "set": { "wet": true }, "silent": true }
```

Without `set` the items are laundered (clean, dry, 0 wear minutes). `set` overrides only
the given fields: `wet`, `dirty`, `wearMinutes` (when `dirty` is omitted it follows the
wear-time threshold). `silent` suppresses the toast.

Dirty clothing drains `Hygiene` and badly-fitting clothing drains `Comfort` (which recovers
when the outfit fits). Change the needs and rates (points per hour) with `clothingNeeds` in
`wearables-config.json`; set an entry to `null` to turn that drain off. A need that isn't
declared in `needs.json` is ignored.

```json
"clothingNeeds": {
  "hygiene": { "need": "Cleanliness", "drainPerDirtyItemPerHour": 1, "maxDrainPerHour": 3 },
  "comfort": { "need": "Comfort", "drainPerMismatchPerHour": 1.5, "maxDrainPerHour": 6, "recoveryPerHour": 5 }
}
```

### Wearable attributes

Wearable templates (and wearables in `items.json`) can carry `warmth` and a free-form
`attributes` map; both are copied onto every wearable generated from a template:

```json
{ "id": "wool_coat", "name": "Wool Coat", "slot": "jacket", "value": 80, "options": {},
  "warmth": 3, "attributes": { "formality": 2, "waterproof": true } }
```

`equipped.<attr>` in a condition sums a numeric attribute across equipped clothing
(`warmth`, `coverage`, `value`, or any numeric key in `attributes`; other values count
as 0).

## Shops

A shop in `shops.json` lists tabs of `item`, `wearable` and `template` entries. By default
an entry costs its item or template `value`. Optional fields:

```json
{
  "id": "boutique",
  "text": "A pricey boutique.",
  "priceMultiplier": 1.5,
  "tabs": [
    {
      "title": "Members",
      "condition": { "kind": "milestone", "milestoneId": "member" },
      "lockedText": "Members only",
      "items": [{ "kind": "item", "itemId": "coffee", "price": 3 }]
    }
  ]
}
```

- `priceMultiplier` scales every entry's value (rounded to cents).
- `price` on an entry sets its exact price, ignoring the value and the multiplier.
- `condition` on a tab or entry hides it while unmet; add `lockedText` to show it
  disabled with that text instead, as with actions.

## Weather

Weather is generated per day from the game seed, then varies hour by hour: spells of a
similar condition (a shower on a cloudy day) and a temperature curve that peaks
mid-afternoon. `weather == '<id>'`, the sidebar and the `weather`/`weatherLabel`/`temperature`
template variables use the current hour. Bad weather drains needs for every hour the
clock passes through, at half rate while asleep. Without `weather.json` each season picks
evenly from a built-in pool. `weather.json` (every field optional) tunes it:

```json
{
  "seasons": {
    "winter": {
      "snowy": 0.03,
      "freezing": 0.04,
      "rainy": 0.3,
      "overcast": 0.35,
      "cloudy": 0.28
    }
  },
  "persistence": 0.65,
  "conditions": {
    "rainy": { "label": "Pouring" },
    "drizzle": {
      "label": "Drizzle",
      "tempMin": 7,
      "tempMax": 13,
      "precipitationChance": 0.6,
      "iconName": "CloudRain"
    }
  }
}
```

- `seasons`: relative weights per condition id (normalised, so they need not sum to 1);
  a season left out keeps its built-in pool.
- `persistence`: chance (0–1) a day keeps the previous day's condition (default 0.65).
- `conditions`: override fields of a built-in condition, or add a new one (`label`,
  `tempMin` and `tempMax` required; `precipitationChance`, `iconName` — `Sun`, `Cloud`,
  `CloudRain`, `CloudSnow`, `Snowflake` or `Wind` — and `iconColor` optional). Added ids
  work in `weather == '<id>'` and the `weather` effect.

The `weather` effect overrides the computed weather:

```json
{
  "kind": "weather",
  "conditionId": "snowy",
  "durationHours": 6,
  "temperature": -4
}
```

Without `durationHours` or `until` (an ISO game time, e.g. `"2025-03-01T18:00:00"`) the
override lasts until cleared; with either it clears itself once game time reaches the
expiry. `temperature` (°C) replaces the computed temperature while the override is active.
`"conditionId": null` clears the override immediately.

## Skills

Skills use one scale, `0` to `skillMax` (`player.json`, default `10`). It caps the player
`skill` effect, sets the default range generated NPCs roll in (`0` to `skillMax / 2`;
override per skill with `npcRange` in `skills.json`, clamped to the scale) and scales
encounter `npcSkillWeights`: an NPC at `skillMax` gets the full multiplier, at `0` none.

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

Each turn advances the clock by `increment` minutes when set, otherwise by the script's
`duration` (or time until `endTime`) split evenly across its scenes. A scene's own
`completionEffects` apply after the action taken in it.

Add `endCondition` to end a script as soon as a condition holds; it is checked after each
turn. `endWith` picks what then runs: `"completion"` (the default) applies
`completionEffects`, `"leave"` applies the leave effects exactly as the leave action would
at that point:

```json
"endCondition": { "kind": "gte", "lhs": { "kind": "money" }, "rhs": { "kind": "const", "value": 100 } },
"endWith": "leave"
```

Scenes and scripts can switch to each other (and to other scenes) with `view` effects in
any file order, but they can't form a loop that leads back to where it started: content
is saved with the game, so a loop fails to load with the scenes/scripts involved named.

## Encounters

`encounters.json` holds turn-based encounters with an NPC: states with actions grouped by
body part, which the player toggles and the NPC picks from by weight each turn. An
encounter ends when:

- the player presses Stop (reason `player`);
- the NPC picks an action with `"npcStop": true` (reason `npc`; its effects apply first,
  and the player is never offered it);
- a `stopCondition` (on the encounter, or on the current state) is met after the NPC's
  pick (reason `condition`).

`stopEffects` apply for every reason; `stopEffectsByReason` adds effects for one reason:

```json
"stopEffects": [{ "kind": "needs", "need": "Energy", "delta": -5 }],
"stopEffectsByReason": { "npc": [{ "kind": "money", "amount": -10 }] }
```

The game returns to the default view.

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
`milestone.<id>`, `equipped.<attr>` (the total of a wearable attribute across equipped
clothing, e.g. `equipped.warmth >= 3`), `season == '<id>'` and `weather == '<id>'`. The
game clock is read in UTC, so hours, weekdays and seasons are the same on every machine;
ISO date literals without an offset (`gametime >= '2025-09-01T08:00'`) are game time too.
An unrecognised bare identifier is a parse error; quote string
literals. `sim check` also flags stored conditions that compare a string with `<`/`>` or
compare two literals, both signs of a mistyped identifier.

## Quests

Each quest in `quests.json` has objectives that go `locked` → `available` → `complete`.
A locked objective becomes available when its `trigger` condition holds. An available
objective completes according to its `condition`:

- a condition: as soon as it holds;
- an action (`{ "kind": "action", "text": …, "effects": [] }`): shown on the default view,
  and taking it applies its effects and completes the objective;
- a scene (`{ "kind": "scene", "sceneId": "cafe" }`, or an inline scene): when the player
  takes any choice while that scene is shown.

`onComplete` effects run however the objective completes. Effects in quests accept the
same id shorthand as elsewhere (e.g. `{ "kind": "view", "sceneId": "cafe" }`). A quest
counts as completed once all of its objectives are complete.

## Referential integrity

References between files (an item id in a shop, a location id in a quest) are checked by
`sim check`. Broken references are reported as
`source: references unknown <namespace> '<id>'`. The check is contribution-driven — adding a
feature or file participates automatically.

# Authoring Content

All content is JSON under `src/game/data/`. The engine loads and validates it at build
time. Every content object carries a `kind` discriminant (`"scene"`, `"item"`,
`"action"`, …).

Run [[CLI|sim check]] after edits to catch broken references.

## Data files

Each engine feature declares which files it consumes. Files marked **optional** can be
omitted or left as an empty `[]` / `{}`.

| File | Purpose | Required |
| --- | --- | --- |
| `locations.json` | Places in the world | ✅ |
| `edges.json` | Travel connections between locations | ✅ |
| `minimap.json` | Minimap node positions & zones | ✅ |
| `items.json` | Inventory items + their actions | ✅ |
| `scenes.json` | Scripted scenes (text + actions) | ✅ |
| `scripts.json` | Timed multi-step scripts | ✅ |
| `wearable-templates.json` | Clothing templates | ✅ (may be `[]`) |
| `wearables-config.json` | Slots, categories, sizing | ✅ |
| `player.json` | Starting player state | ✅ |
| `needs.json` | Needs & decay rates | ✅ |
| `currency.json` / `initial-money.json` | Money setup | ✅ |
| `time.json` | Game start timestamp (ISO string) | ✅ |
| `names.json` | Random NPC name pools | ✅ |
| `professions.json` | NPC professions | ✅ |
| `quests.json` | Quests & objectives | ✅ (may be `[]`) |
| `milestones.json` | Milestones | ✅ (may be `[]`) |
| `shops.json` | Shops & stock | ✅ (may be `[]`) |
| `appearance.json` | Body/appearance attributes | optional |
| `skills.json` | Player skills | optional |
| `conversations.json` | NPC conversation topics | optional |
| `named-npcs.json` | Hand-authored NPCs | optional |
| `encounters.json` | Random encounters | optional |
| `events.json` | World events | optional |
| `quest-templates.json` | Reusable quest templates | optional |
| `linguistics.json` | Text macros & terms | optional |

## Effects

Actions apply **effects** — the only way player actions change state. Each effect has a
`kind`. Common built-ins:

```json
{ "kind": "needs", "need": "Energy", "delta": 20 }
{ "kind": "inventory", "operation": "remove", "id": "coffee" }
{ "kind": "money", "delta": -5 }
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
    { "actions": [
      { "kind": "action", "text": "Drink the coffee", "effects": [
        { "kind": "needs", "need": "Energy", "delta": 20 },
        { "kind": "inventory", "operation": "remove", "id": "coffee" }
      ] }
    ] }
  ]
}
```

Extensions can add their own effect kinds — see [[Extensions]].

## Conditions

Actions and objectives can be gated by **conditions**, an expression DSL with a `kind`:

```json
{
  "kind": "eq",
  "lhs": { "kind": "location" },
  "rhs": { "kind": "string", "value": "kitchen" }
}
```

Combine with `and` / `or` / `not`. Expression nodes (`location`, `string`, `time`, need
levels, …) are contributed by features, so the available vocabulary grows with the engine.

## Referential integrity

References between files (an item id in a shop, a location id in a quest) are checked by
`sim check`. Broken references are reported as
`source: references unknown <namespace> '<id>'`. The check is contribution-driven — adding a
feature or file participates automatically.

---
"@chemicalluck/sim-engine": patch
"@chemicalluck/sim-config": patch
"@chemicalluck/create-sim-game": patch
---

Fix a freshly scaffolded game crashing on load and in the editor: skip `contentSetup`
calls for absent optional content extensions (e.g. `encounters.json`), let the Player
Defaults panel handle a `player.json` without `bodyParts` / `initialItems` /
`initialEquipment`, and ship the starter's missing data files. The shared ESLint preset
now uses `defineConfig` so `extends` works under flat config.

---
"@chemicalluck/sim-engine": minor
---

Fix quest objectives: action objectives with their own effects now complete, `onComplete` fires on every completion path, scene objectives complete when a choice is taken in their scene, partly done quests are no longer listed as completed, and `quests.json` is hydrated, resolving shorthand effects and `{ kind: "scene", sceneId }` objectives.

---
"@chemicalluck/sim-engine": patch
---

Importing `RootState` (or the shared types) now brings every built-in feature's
`PresentState`, effect, condition and content augmentations into a game's TypeScript
program, so `state.present.time` and friends type correctly without importing each
feature's slice.

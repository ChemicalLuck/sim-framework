---
"@chemicalluck/create-sim-game": patch
---

Scaffolded games now depend on the framework versions released with the scaffolder
(read from the workspace at build time) instead of a hardcoded `^0.1.0`, which would
have kept new games on 0.1.x after the engine and CLI move to 0.2.

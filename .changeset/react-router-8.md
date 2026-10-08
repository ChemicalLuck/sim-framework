---
"@chemicalluck/sim-engine": minor
"@chemicalluck/sim-cli": patch
"@chemicalluck/create-sim-game": patch
---

Upgrade react-router to v8. The engine now requires Node.js >=22.22.0 and React >=19.2.7
(react-router 8's minimums). The CLI no longer pre-bundles `cookie` / `set-cookie-parser`,
which react-router 8 dropped (its replacement deps are ESM); the starter template now
depends on React ^19.2.7.

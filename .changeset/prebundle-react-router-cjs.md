---
"@chemicalluck/sim-cli": patch
---

Pre-bundle react-router's CJS-only deps (`cookie`, `set-cookie-parser`) via
`optimizeDeps.include` so games consuming the source-served engine don't crash with
"doesn't provide an export named 'parse'".

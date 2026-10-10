---
"@chemicalluck/sim-engine": patch
"@chemicalluck/sim-cli": patch
---

`sim check` only warns about missing data files that feature manifests declare required, not absent optional ones such as `weather.json`.

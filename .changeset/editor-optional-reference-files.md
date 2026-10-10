---
"@chemicalluck/sim-engine": patch
---

The editor's reference validation skips content files the game doesn't have (e.g. an optional `weather.json`) instead of failing, while still surfacing real read and parse errors.

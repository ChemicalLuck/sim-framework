---
"@chemicalluck/sim-engine": patch
---

The editor tolerates absent optional data files (quests.json, events.json, …): their panels open empty and saving creates them, global search, effect data and rename skip them, missing required files are listed under problems, and the dev data server answers 404 only for a missing file (500 with the message for other read errors).

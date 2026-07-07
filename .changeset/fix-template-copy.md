---
"@chemicalluck/create-sim-game": patch
---

Fix scaffolding when the package is installed from npm. The template-copy filter
rejected every path because the installed template lives under `node_modules`;
it now tests paths relative to the template root, so `create-sim-game` copies
the starter correctly.

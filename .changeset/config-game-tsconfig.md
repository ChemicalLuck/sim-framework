---
"@chemicalluck/sim-config": minor
"@chemicalluck/create-sim-game": patch
---

`tsconfig/game.json` no longer sets `include`, `baseUrl` or `paths`, which TypeScript
resolved inside `node_modules` (so `tsc -p .` found no inputs). Set them in the game's
own `tsconfig.json`, as the starter now does:
`"compilerOptions": { "paths": { "~/*": ["./src/*"] } }, "include": ["src", "sim-env.d.ts"]`.

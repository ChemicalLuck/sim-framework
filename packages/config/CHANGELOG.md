# @chemicalluck/sim-config

## 0.1.1

### Patch Changes

- d68825b: `tsconfig/game.json` no longer sets `include`, `baseUrl` or `paths`, which TypeScript
  resolved inside `node_modules` (so `tsc -p .` found no inputs). Set them in the game's
  own `tsconfig.json`, as the starter now does:
  `"compilerOptions": { "paths": { "~/*": ["./src/*"] } }, "include": ["src", "sim-env.d.ts"]`.
- 077d4bb: Fix a freshly scaffolded game crashing on load and in the editor: skip `contentSetup`
  calls for absent optional content extensions (e.g. `encounters.json`), let the Player
  Defaults panel handle a `player.json` without `bodyParts` / `initialItems` /
  `initialEquipment`, and ship the starter's missing data files. The shared ESLint preset
  now uses `defineConfig` so `extends` works under flat config.

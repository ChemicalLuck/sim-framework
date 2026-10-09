---
"@chemicalluck/sim-engine": patch
---

Engine subpath imports such as `@chemicalluck/sim-engine/features/npcs/types` now
resolve in a game's TypeScript program (`moduleResolution: bundler`) without a `paths`
workaround: the `./*` export lists `.ts`, `.tsx` and `index` candidates under the `types`
condition.

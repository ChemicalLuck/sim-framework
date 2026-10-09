---
"@chemicalluck/sim-cli": minor
---

Add `sim test`, which runs a game's tests with vitest using the same engine setup as
`sim dev` (aliases, `virtual:*` modules, React dedupe) plus jsdom, globals and the
jest-dom matchers. The config is also exported as `simVitestConfig()` from
`@chemicalluck/sim-cli/vitest` for a game's own `vitest.config.ts`.

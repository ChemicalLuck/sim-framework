---
"@chemicalluck/sim-cli": patch
---

Point Vite's dep scanner at the engine source (`optimizeDeps.entries`) so the
engine's whole transitive dep graph is pre-bundled up-front with correct
CJS/ESM interop. The engine is aliased to source and excluded from
pre-bundling, and Vite doesn't crawl excluded deps — so its transitive deps
were discovered lazily, intermittently breaking named/default imports of
CJS-only leaves (e.g. `use-sync-external-store` via `zustand`/`@xyflow/react`,
`cookie` via `react-router`) with "doesn't provide an export named …". The
engine's own tests are excluded from the scan so games don't need its dev-only
test deps installed.

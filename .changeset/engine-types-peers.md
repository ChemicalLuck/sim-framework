---
"@chemicalluck/sim-engine": patch
---

Declare `@types/react` and `@types/react-dom` as peer dependencies. The engine ships
`.tsx` source that a game typechecks, so without them every JSX expression types as an
error.

# sim-framework

The **sim** game framework — a browser-based life-sim engine, content editor, CLI, and
scaffolder. This monorepo publishes the framework packages; games live in their own repos
and depend on them.

📖 **Docs:** the [wiki](https://github.com/ChemicalLuck/sim-framework/wiki)
(source in [`docs/wiki/`](./docs/wiki)).

## Packages

| Package | Description |
| --- | --- |
| [`@chemicalluck/engine`](./packages/engine) | Game-agnostic runtime, content editor, and Vite plugins (shipped as source). |
| [`@chemicalluck/sim`](./packages/cli) | CLI (bin `sim`): `dev` / `build` / `editor` / `preview` / `check`. |
| [`@chemicalluck/create-sim-game`](./packages/create-sim-game) | Scaffolder — `npm create @chemicalluck/sim-game my-game`. |
| [`@chemicalluck/config`](./packages/config) | Shared TypeScript / ESLint / Prettier presets. |

`examples/` and `templates/` are private workspace packages (not published).

## Develop

```bash
pnpm install
pnpm -r run typecheck
pnpm -r run test
pnpm build:packages
```

## Releasing

Releases use [Changesets](https://github.com/changesets/changesets) and the **Release**
GitHub Action.

1. With any change that should ship, add a changeset:
   ```bash
   pnpm changeset
   ```
   Commit the generated file with your PR.
2. On merge to `main`, the Release workflow opens a **"Version Packages"** PR that applies
   pending changesets (bumping versions, writing changelogs).
3. Merging that PR publishes the changed packages to npm.

### One-time setup

- Add an **`NPM_TOKEN`** repository secret (a granular npm automation token with publish
  rights to the `@chemicalluck` scope).
- Ensure your npm account owns the `@chemicalluck` scope and can publish to it.
- The workflow publishes with npm **provenance** (`id-token: write`); this requires the
  repo to be public. If it is private, remove `NPM_CONFIG_PROVENANCE` from
  `.github/workflows/release.yml`.

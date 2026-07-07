# Changesets

This folder holds [changesets](https://github.com/changesets/changesets) — one Markdown
file per set of changes, declaring which packages changed and at what semver level.

## Workflow

When you make a change that should be released, add a changeset:

```bash
pnpm changeset
```

Pick the affected packages and bump levels, and write a short summary (it becomes the
changelog entry). Commit the generated file alongside your change.

On merge to `main`, the **Release** GitHub Action opens (or updates) a "Version Packages"
PR that applies the pending changesets — bumping versions and writing changelogs. Merging
**that** PR publishes the updated packages to npm.

Private packages (`examples/*`, `templates/*`) are ignored automatically.

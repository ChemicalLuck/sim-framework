# Docs

The documentation is published as the project's **GitHub wiki**, but the source of truth
lives here in `docs/wiki/` so it's versioned and reviewed alongside the code.

## Pages

`docs/wiki/*.md` — one file per wiki page. Filenames map to page titles (GitHub converts
between spaces and hyphens), so `Getting-Started.md` is the "Getting Started" page. Pages
link to each other with `[[Page Name]]`. Special pages:

- `Home.md` — the wiki landing page.
- `_Sidebar.md` — the navigation sidebar shown on every page.
- `_Footer.md` — the footer shown on every page.

## Publishing

GitHub wikis are a separate git repo (`<repo>.wiki.git`). Create the first page once via the
GitHub UI (repo → **Wiki** → *Create the first page*), then mirror `docs/wiki/` into it:

```bash
docs/sync-wiki.sh                 # derives the wiki URL from your `origin` remote
# or
docs/sync-wiki.sh git@github.com:<owner>/<repo>.wiki.git
```

Edit pages here, commit them with your normal PRs, and run `sync-wiki.sh` to publish.

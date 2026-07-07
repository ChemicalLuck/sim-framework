#!/usr/bin/env bash
#
# Publish docs/wiki/*.md to this repo's GitHub wiki.
#
# GitHub wikis are a separate git repo at <repo>.wiki.git. This script keeps
# docs/wiki/ as the version-controlled source of truth and mirrors it there.
#
# Usage:
#   docs/sync-wiki.sh                 # derive the wiki URL from `origin`
#   docs/sync-wiki.sh <wiki-git-url>  # or pass it explicitly
#
# The wiki repo must already exist: create the first page once in the GitHub
# UI (repo → Wiki → Create the first page), then run this.

set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
src="$here/wiki"
repo_root="$(cd "$here/.." && pwd)"

if [ "$#" -ge 1 ]; then
  wiki_url="$1"
else
  origin="$(git -C "$repo_root" remote get-url origin 2>/dev/null || true)"
  if [ -z "$origin" ]; then
    echo "No 'origin' remote found. Pass the wiki URL explicitly:" >&2
    echo "  $0 git@github.com:<owner>/<repo>.wiki.git" >&2
    exit 1
  fi
  wiki_url="${origin%.git}.wiki.git"
fi

echo "Syncing $src → $wiki_url"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git clone --quiet "$wiki_url" "$work"

# Replace the wiki's markdown with our source of truth.
find "$work" -maxdepth 1 -name '*.md' -delete
cp "$src"/*.md "$work"/

cd "$work"
git add -A
if git diff --cached --quiet; then
  echo "Wiki already up to date."
  exit 0
fi
git commit --quiet -m "Update wiki from docs/wiki"
git push --quiet
echo "✓ Wiki updated."

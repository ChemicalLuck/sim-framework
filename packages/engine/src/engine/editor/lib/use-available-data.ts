import editorExtensions from 'virtual:editor-extensions';

import { preloadEditorData, readOptionalEditorData } from './use-editor-data';

export type { AvailableData } from './effect-editor';

function defaultExtract(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { id?: string }[])
    .map((item) => item.id ?? '')
    .filter(Boolean);
}

// readEditorData throws Suspense promises, so this must be called from a
// component during render — the `use` prefix reflects hook-like semantics.
// eslint-disable-next-line react-x/no-unnecessary-use-prefix
export function useAvailableData(): Record<string, unknown> {
  const requirements = editorExtensions.dataRequirements ?? [];

  // Deduplicate by key (first declaration wins)
  const seen = new Set<string>();
  const unique: typeof requirements = [];
  for (const req of requirements) {
    if (!seen.has(req.key)) {
      seen.add(req.key);
      unique.push(req);
    }
  }

  // Start all fetches in parallel before reading any
  preloadEditorData(...unique.map((r) => `/editor/api/data/${r.key}`));

  // Read each result (throws via Suspense if not yet loaded). A file the game
  // doesn't have (optional content such as events.json) offers no ids.
  const result: Record<string, unknown> = {};
  for (const req of unique) {
    const raw = readOptionalEditorData(`/editor/api/data/${req.key}`);
    if (raw === undefined) result[req.key] = [];
    else result[req.key] = req.extract ? req.extract(raw) : defaultExtract(raw);
  }
  return result;
}

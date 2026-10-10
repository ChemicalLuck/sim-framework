import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAvailableData } from './use-available-data';
import { preloadEditorData, readOptionalEditorData } from './use-editor-data';

vi.mock('virtual:editor-extensions', () => ({
  default: {
    dataRequirements: [
      { key: 'items' },
      { key: 'events' },
      // A custom extractor that would throw if handed an absent file.
      {
        key: 'needs',
        extract: (raw: unknown) =>
          Object.keys((raw as { needs: Record<string, unknown> }).needs),
      },
    ],
  },
}));

// Only items.json exists; every other file is absent (404), as optional content
// files (events.json, quests.json, …) may legitimately be.
vi.stubGlobal('fetch', (url: string) =>
  Promise.resolve(
    url === '/editor/api/data/items'
      ? ({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: 'sword' }]),
        } as Response)
      : ({ ok: false, status: 404 } as Response),
  ),
);

describe('useAvailableData', () => {
  it('offers no ids for absent files instead of throwing', async () => {
    const keys = ['items', 'needs', 'events'];
    preloadEditorData(...keys.map((k) => `/editor/api/data/${k}`));
    await waitFor(() => {
      for (const k of keys) readOptionalEditorData(`/editor/api/data/${k}`);
    });

    const { result } = renderHook(() => useAvailableData());
    expect(result.current).toEqual({ items: ['sword'], events: [], needs: [] });
  });
});

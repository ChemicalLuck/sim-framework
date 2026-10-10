import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// validation.tsx (imported by usePanelEntries) preloads every file the
// reference contributions read as soon as it loads, so fetch is stubbed before
// any module import. Only the files in `files` exist; every other read is a 404,
// as optional content files (quests.json, events.json, …) may legitimately be.
const { files, posts } = vi.hoisted(() => {
  const files = new Map<string, unknown>([
    ['locations', [{ id: 'a', name: 'A' }]],
    ['edges', [{ nodes: ['a', 'other'] }]],
  ]);
  const posts: { url: string; body: unknown }[] = [];
  globalThis.fetch = ((url: string, opts?: RequestInit) => {
    if (opts?.method === 'POST') {
      posts.push({ url, body: JSON.parse(opts.body as string) });
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('{"ok":true}'),
      } as Response);
    }
    const file = url.replace('/editor/api/data/', '');
    return Promise.resolve(
      files.has(file)
        ? ({
            ok: true,
            status: 200,
            json: () => Promise.resolve(files.get(file)),
          } as Response)
        : ({ ok: false, status: 404 } as Response),
    );
  }) as typeof fetch;
  return { files, posts };
});

const { PanelFileProvider } = await import('./panel-file');
const { SaveHandlerProvider, useSaveContext } = await import('./save-context');
const { UnsavedChangesProvider } = await import('./unsaved-changes');
const { preloadEditorData, readOptionalEditorData } = await import(
  './use-editor-data'
);
const { usePanelEntries } = await import('./use-panel-entries');

interface Entry {
  id: string;
  name: string;
  objectives?: unknown[];
}

function wrapperFor(file: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[`/${file}`]}>
        <UnsavedChangesProvider>
          <SaveHandlerProvider>
            <PanelFileProvider file={file}>{children}</PanelFileProvider>
          </SaveHandlerProvider>
        </UnsavedChangesProvider>
      </MemoryRouter>
    );
  };
}

// Wait until the file's GET has settled so the hook won't suspend.
async function loaded(file: string) {
  const url = `/editor/api/data/${file}`;
  preloadEditorData(url);
  await waitFor(() => {
    readOptionalEditorData(url);
  });
}

afterEach(() => {
  posts.length = 0;
  vi.clearAllMocks();
});

describe('usePanelEntries with an absent data file', () => {
  it('opens empty, and saving creates the file', async () => {
    expect(files.has('quests')).toBe(false);
    await loaded('quests');

    const { result } = renderHook(
      () => ({
        entries: usePanelEntries<Entry>(),
        saveAll: useSaveContext().saveAll,
      }),
      { wrapper: wrapperFor('quests') },
    );
    expect(result.current.entries.ids).toEqual([]);
    expect(result.current.entries.dirty).toBe(false);

    act(() => {
      result.current.entries.handleAdd({
        id: 'q1',
        name: 'First',
        objectives: [],
      });
    });
    await act(async () => {
      result.current.saveAll();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(posts).toEqual([
        {
          url: '/editor/api/data/quests',
          body: [{ id: 'q1', name: 'First', objectives: [] }],
        },
      ]);
    });
  });
});

describe('usePanelEntries rename', () => {
  // Every reference-holding file but locations and edges (and the quests.json
  // saved above — the cache is a module singleton) is absent.
  it('skips absent files when rewriting references', async () => {
    await loaded('locations');
    const { result } = renderHook(() => usePanelEntries<Entry>(), {
      wrapper: wrapperFor('locations'),
    });
    expect(result.current.ids).toEqual(['a']);

    await act(async () => {
      await result.current.rename('a', 'b');
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith(
      'Renamed a → b (1 reference updated)',
    );
    expect(posts).toEqual(
      expect.arrayContaining([
        { url: '/editor/api/data/locations', body: [{ id: 'b', name: 'A' }] },
        { url: '/editor/api/data/edges', body: [{ nodes: ['b', 'other'] }] },
      ]),
    );
    expect(posts).toHaveLength(2);
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  preloadEditorData,
  readEditorData,
  subscribeEditorData,
  useEditorData,
} from './use-editor-data';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const success = vi.mocked(toast.success);
const error = vi.mocked(toast.error);

interface Doc {
  value: number;
}

// Each test uses a unique endpoint — the resource cache is a module singleton
// that persists across tests.
let counter = 0;
function freshEndpoint() {
  return `/editor/api/data/test-${String(counter++)}`;
}

function stubFetch(initial: Doc) {
  const fetchMock = vi.fn((_url: string, opts?: RequestInit) => {
    if (opts?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('{"ok":true}'),
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(initial),
    } as Response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function seed(endpoint: string) {
  preloadEditorData(endpoint);
  // Wait until the GET has populated the cache so the hook won't suspend.
  await waitFor(() => {
    readEditorData(endpoint);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useEditorData', () => {
  it('seeds data from the GET response', async () => {
    const endpoint = freshEndpoint();
    stubFetch({ value: 1 });
    await seed(endpoint);

    const { result } = renderHook(() => useEditorData<Doc>(endpoint));
    expect(result.current.data).toEqual({ value: 1 });
    expect(result.current.original).toEqual({ value: 1 });
  });

  it('save POSTs the payload, updates data/original, and toasts', async () => {
    const endpoint = freshEndpoint();
    const fetchMock = stubFetch({ value: 1 });
    await seed(endpoint);

    const { result } = renderHook(() => useEditorData<Doc>(endpoint));

    await act(async () => {
      await result.current.save({ value: 2 }, 'Saved');
    });

    expect(fetchMock).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: 2 }, null, 2),
      }),
    );
    expect(success).toHaveBeenCalledWith('Saved');
    expect(result.current.data).toEqual({ value: 2 });
    expect(result.current.original).toEqual({ value: 2 });
  });

  it('notifies cache subscribers on save', async () => {
    const endpoint = freshEndpoint();
    stubFetch({ value: 1 });
    await seed(endpoint);

    const listener = vi.fn();
    const unsubscribe = subscribeEditorData(listener);
    const { result } = renderHook(() => useEditorData<Doc>(endpoint));

    await act(async () => {
      await result.current.save({ value: 3 });
    });

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('discard reverts unsaved local edits to the original', async () => {
    const endpoint = freshEndpoint();
    stubFetch({ value: 1 });
    await seed(endpoint);

    const { result } = renderHook(() => useEditorData<Doc>(endpoint));
    act(() => {
      result.current.setData({ value: 99 });
    });
    expect(result.current.data).toEqual({ value: 99 });

    act(() => {
      result.current.discard();
    });
    expect(result.current.data).toEqual({ value: 1 });
  });

  it('surfaces a failed save via toast.error and keeps original', async () => {
    const endpoint = freshEndpoint();
    stubFetch({ value: 1 });
    await seed(endpoint);
    // Make the next POST fail.
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.resolve('boom'),
        } as Response),
      ),
    );

    const { result } = renderHook(() => useEditorData<Doc>(endpoint));
    await act(async () => {
      await result.current.save({ value: 5 });
    });

    expect(error).toHaveBeenCalled();
    expect(result.current.original).toEqual({ value: 1 });
  });
});

import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

// ── Suspense resource cache ───────────────────────────────────────

type Resource =
  | { status: 'pending'; promise: Promise<void> }
  | { status: 'success'; data: unknown }
  | { status: 'error'; error: unknown };

const cache = new Map<string, Resource>();

// Cache-change subscription — lets derived consumers (e.g. the validation
// surface) recompute when a file is fetched or saved.
const listeners = new Set<() => void>();

export function subscribeEditorData(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyEditorData(): void {
  for (const cb of listeners) cb();
}

function ensureResource(url: string): void {
  if (cache.has(url)) return;
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  const entry: Resource = { status: 'pending', promise };
  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${String(r.status)}`);
      return r.json() as Promise<unknown>;
    })
    .then((data) => {
      cache.set(url, { status: 'success', data });
      resolve();
      notifyEditorData();
    })
    .catch((e: unknown) => {
      cache.set(url, { status: 'error', error: e });
      resolve();
      notifyEditorData();
    });
  cache.set(url, entry);
}

function readResource(url: string): unknown {
  ensureResource(url);
  const resource = cache.get(url) ?? {
    status: 'error',
    error: new Error(`No resource: ${url}`),
  };
  if (resource.status === 'pending') {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw resource.promise;
  }
  if (resource.status === 'error') throw resource.error as Error;
  return resource.data;
}

export function preloadEditorData(...urls: string[]): void {
  for (const url of urls) ensureResource(url);
}

export function readEditorData(url: string): unknown {
  return readResource(url);
}

function updateCache(url: string, data: unknown): void {
  cache.set(url, { status: 'success', data });
  notifyEditorData();
}

/**
 * Persist `data` to a data endpoint and refresh the cache, without going through
 * a mounted panel's save handler. Used by cross-file operations (e.g. rename's
 * reference rewrite) that must write files whose panels aren't currently open.
 * Throws on failure so the caller can surface a single aggregated error.
 */
export async function writeEditorData(
  url: string,
  data: unknown,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data, null, 2),
  });
  if (!res.ok) throw new Error(await res.text());
  updateCache(url, data);
}

// ── Data epoch ────────────────────────────────────────────────────
// A monotonically increasing counter bumped after a cross-file mutation. Panels
// use it as a React `key` so they re-seed their working state from the refreshed
// cache when files change underneath them (e.g. after a rename).

let epoch = 0;
const epochListeners = new Set<() => void>();

export function bumpDataEpoch(): void {
  epoch += 1;
  for (const cb of epochListeners) cb();
}

function subscribeEpoch(cb: () => void): () => void {
  epochListeners.add(cb);
  return () => epochListeners.delete(cb);
}

export function useDataEpoch(): number {
  return useSyncExternalStore(
    subscribeEpoch,
    () => epoch,
    () => epoch,
  );
}

// ── Hook ─────────────────────────────────────────────────────────

export interface EditorDataHandle<T> {
  data: T;
  original: T;
  setData: Dispatch<SetStateAction<T>>;
  saving: boolean;
  save: (payload: unknown, message?: string) => Promise<void>;
  discard: () => void;
}

export function useEditorData<T>(endpoint: string): EditorDataHandle<T> {
  const initialData = readResource(endpoint) as T;
  const originalRef = useRef<T>(initialData);
  const [data, setData] = useState<T>(initialData);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (payload: unknown, message = 'Saved') => {
      setSaving(true);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload, null, 2),
        });
        if (!res.ok) throw new Error(await res.text());
        updateCache(endpoint, payload);
        originalRef.current = payload as T;
        setData(payload as T);
        if (message) toast.success(message);
      } catch (e) {
        toast.error(`Save failed: ${String(e)}`);
      } finally {
        setSaving(false);
      }
    },
    [endpoint],
  );

  const discard = useCallback(() => {
    setData(originalRef.current);
  }, []);

  return {
    data,
    original: originalRef.current,
    setData,
    saving,
    save,
    discard,
  };
}

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

/** The data endpoint reported the file absent (HTTP 404). */
export class EditorDataNotFoundError extends Error {}

function ensureResource(url: string): void {
  if (cache.has(url)) return;
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  const entry: Resource = { status: 'pending', promise };
  fetch(url)
    .then(async (r) => {
      if (r.status === 404) throw new EditorDataNotFoundError('HTTP 404');
      if (!r.ok) {
        // The data server sends the read error's message with a 500.
        const detail = await Promise.resolve()
          .then(() => r.text())
          .catch(() => '');
        throw new Error(
          `HTTP ${String(r.status)}${detail ? `: ${detail}` : ''}`,
        );
      }
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

/**
 * Like {@link readEditorData}, but an absent file reads as `undefined` instead
 * of throwing — for content files a game may legitimately omit (e.g. the
 * optional `weather.json`). Other failures (server or parse errors) still throw.
 */
export function readOptionalEditorData(url: string): unknown {
  try {
    return readResource(url);
  } catch (e) {
    if (e instanceof EditorDataNotFoundError) return undefined;
    throw e;
  }
}

/**
 * Like {@link readOptionalEditorData}, but an absent file reads as `fallback` —
 * the empty value of the file's shape (e.g. `[]` for a list file).
 */
export function readEditorDataOr<T>(url: string, fallback: T): T {
  const data = readOptionalEditorData(url);
  return data === undefined ? fallback : (data as T);
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

export interface EditorDataOptions<T> {
  /**
   * The value an absent file (HTTP 404) reads as — the empty value of its shape
   * (e.g. `[]` for a list file). The panel then opens empty, and saving creates
   * the file. Without it, an absent file throws like any other read error.
   */
  whenAbsent: T;
}

export function useEditorData<T>(
  endpoint: string,
  options?: EditorDataOptions<T>,
): EditorDataHandle<T> {
  const initialData = options
    ? readEditorDataOr(endpoint, options.whenAbsent)
    : (readResource(endpoint) as T);
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

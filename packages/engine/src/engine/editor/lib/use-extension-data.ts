import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface ExtensionDataHandle<T> {
  data: T | null;
  original: T | null;
  setData: Dispatch<SetStateAction<T | null>>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: () => Promise<void>;
  discard: () => void;
  reload: () => void;
}

export function useExtensionData<T>(key: string): ExtensionDataHandle<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const originalRef = useRef<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/editor/api/extensions/${key}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${String(r.status)} ${r.statusText}`);
        return r.json() as Promise<T>;
      })
      .then((json) => {
        if (cancelled) return;
        originalRef.current = json;
        setData(json);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, reloadToken]);

  const save = useCallback(async () => {
    if (data == null) return;
    setSaving(true);
    try {
      const res = await fetch(`/editor/api/extensions/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2),
      });
      if (!res.ok) throw new Error(await res.text());
      originalRef.current = data;
      toast.success('Saved');
    } catch (e) {
      toast.error(`Save failed: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }, [key, data]);

  const discard = useCallback(() => {
    setData(originalRef.current);
  }, []);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return {
    data,
    original: originalRef.current,
    setData,
    loading,
    saving,
    error,
    save,
    discard,
    reload,
  };
}

/* eslint-disable react-refresh/only-export-components */
import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

interface DirtyEntry {
  dirty: boolean;
  discard: () => void;
}

interface UnsavedChangesContextValue {
  dirty: boolean;
  register: (id: string, entry: DirtyEntry) => void;
  unregister: (id: string) => void;
  discardAll: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const entries = useRef<Map<string, DirtyEntry>>(new Map());
  const [dirty, setDirty] = useState(false);

  const recompute = useCallback(() => {
    let next = false;
    for (const entry of entries.current.values()) {
      if (entry.dirty) {
        next = true;
        break;
      }
    }
    setDirty((prev) => (prev === next ? prev : next));
  }, []);

  const register = useCallback(
    (id: string, entry: DirtyEntry) => {
      entries.current.set(id, entry);
      recompute();
    },
    [recompute],
  );

  const unregister = useCallback(
    (id: string) => {
      entries.current.delete(id);
      recompute();
    },
    [recompute],
  );

  const discardAll = useCallback(() => {
    for (const entry of entries.current.values()) {
      if (entry.dirty) entry.discard();
    }
  }, []);

  const value = useMemo(
    () => ({ dirty, register, unregister, discardAll }),
    [dirty, register, unregister, discardAll],
  );

  return (
    <UnsavedChangesContext value={value}>{children}</UnsavedChangesContext>
  );
}

function useUnsavedChangesContext(): UnsavedChangesContextValue {
  const ctx = use(UnsavedChangesContext);
  if (!ctx) {
    throw new Error(
      'UnsavedChanges hook used outside <UnsavedChangesProvider>',
    );
  }
  return ctx;
}

export function useReportDirty({
  dirty,
  discard,
}: {
  dirty: boolean;
  discard: () => void;
}): void {
  const ctx = useUnsavedChangesContext();
  const id = useId();
  const discardRef = useRef(discard);
  discardRef.current = discard;

  useEffect(() => {
    ctx.register(id, {
      dirty,
      discard: () => {
        discardRef.current();
      },
    });
    return () => {
      ctx.unregister(id);
    };
  }, [ctx, id, dirty]);
}

export function useUnsavedChanges(): {
  dirty: boolean;
  discardAll: () => void;
} {
  const { dirty, discardAll } = useUnsavedChangesContext();
  return { dirty, discardAll };
}

export interface ConfirmState {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useDirtyGuard({
  dirty,
  discard,
}: {
  dirty: boolean;
  discard: () => void;
}) {
  const [pending, setPending] = useState<(() => void) | null>(null);

  const confirm = useCallback(
    (action: () => void) => {
      if (dirty) {
        setPending(() => action);
      } else {
        action();
      }
    },
    [dirty],
  );

  const onConfirm = useCallback(() => {
    const action = pending;
    setPending(null);
    if (action) {
      discard();
      action();
    }
  }, [pending, discard]);

  const onCancel = useCallback(() => {
    setPending(null);
  }, []);

  return {
    confirm,
    confirmState: {
      open: pending !== null,
      onConfirm,
      onCancel,
    },
  };
}

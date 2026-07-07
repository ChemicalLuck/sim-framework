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

interface SaveActions {
  register: (id: string, save: () => void) => void;
  unregister: (id: string) => void;
  setSaving: (id: string, s: boolean) => void;
  saveAll: () => void;
}

const SaveActionsContext = createContext<SaveActions | null>(null);
const SaveStateContext = createContext(false);

export function SaveHandlerProvider({ children }: { children: ReactNode }) {
  const saveHandlers = useRef<Map<string, () => void>>(new Map());
  const savingMap = useRef<Map<string, boolean>>(new Map());
  const [saving, setSavingState] = useState(false);

  const recompute = useCallback(() => {
    let next = false;
    for (const s of savingMap.current.values()) {
      if (s) {
        next = true;
        break;
      }
    }
    setSavingState((prev) => (prev === next ? prev : next));
  }, []);

  const register = useCallback((id: string, save: () => void) => {
    saveHandlers.current.set(id, save);
  }, []);

  const unregister = useCallback(
    (id: string) => {
      saveHandlers.current.delete(id);
      savingMap.current.delete(id);
      recompute();
    },
    [recompute],
  );

  const setSaving = useCallback(
    (id: string, s: boolean) => {
      savingMap.current.set(id, s);
      recompute();
    },
    [recompute],
  );

  const saveAll = useCallback(() => {
    for (const save of saveHandlers.current.values()) {
      save();
    }
  }, []);

  const actions = useMemo(
    () => ({ register, unregister, setSaving, saveAll }),
    [register, unregister, setSaving, saveAll],
  );

  return (
    <SaveActionsContext value={actions}>
      <SaveStateContext value={saving}>{children}</SaveStateContext>
    </SaveActionsContext>
  );
}

function useSaveActions(): SaveActions {
  const ctx = use(SaveActionsContext);
  if (!ctx) throw new Error('useSaveActions used outside SaveHandlerProvider');
  return ctx;
}

export function useRegisterSave({
  save,
  saving,
}: {
  save: () => void;
  saving: boolean;
}): void {
  const actions = useSaveActions();
  const id = useId();
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    actions.register(id, () => {
      saveRef.current();
    });
    return () => {
      actions.unregister(id);
    };
  }, [actions, id]);

  useEffect(() => {
    actions.setSaving(id, saving);
  }, [saving, actions, id]);
}

export function useSaveContext(): { saving: boolean; saveAll: () => void } {
  const saving = use(SaveStateContext);
  const { saveAll } = useSaveActions();
  return { saving, saveAll };
}

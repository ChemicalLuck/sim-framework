import { useMemo, useState } from 'react';

import {
  type ConfirmState,
  useDirtyGuard,
  useReportDirty,
} from './unsaved-changes';
import { useIsDirty } from './use-is-dirty';

interface PanelItemsResult<T extends { id: string }> {
  items: Record<string, T>;
  ids: string[];
  dirty: boolean;
  discard: () => void;
  confirmSelect: (callback: () => void) => void;
  confirmState: ConfirmState;
  handleChange: (id: string, updated: T) => void;
  handleAdd: (item: T) => void;
  handleClone: (sourceId: string, newId: string) => T | null;
  handleDelete: (id: string) => { remaining: string[] };
}

export function usePanelItems<T extends { id: string }>(
  rawItems: T[],
  discardRaw: () => void,
): PanelItemsResult<T> {
  const [items, setItems] = useState<Record<string, T>>(() =>
    Object.fromEntries(rawItems.map((i) => [i.id, i])),
  );

  const dirty = useIsDirty(rawItems, items);

  function discard() {
    discardRaw();
    setItems(Object.fromEntries(rawItems.map((i) => [i.id, i])));
  }

  useReportDirty({ dirty, discard });
  const { confirm: confirmSelect, confirmState } = useDirtyGuard({
    dirty,
    discard,
  });

  const ids = useMemo(() => Object.keys(items), [items]);

  function handleChange(id: string, updated: T) {
    setItems((prev) => ({ ...prev, [id]: updated }));
  }

  function handleAdd(item: T) {
    setItems((prev) => ({ [item.id]: item, ...prev }));
  }

  function handleClone(sourceId: string, newId: string): T | null {
    if (!(sourceId in items) || newId in items) return null;
    const clone = { ...structuredClone(items[sourceId]), id: newId };
    setItems((prev) => ({ [newId]: clone, ...prev }));
    return clone;
  }

  function handleDelete(id: string): { remaining: string[] } {
    const remaining = Object.keys(items).filter((k) => k !== id);
    setItems((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id)),
    );
    return { remaining };
  }

  return {
    items,
    ids,
    dirty,
    discard,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd,
    handleClone,
    handleDelete,
  };
}

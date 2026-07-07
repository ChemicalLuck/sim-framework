import { useMemo } from 'react';

export function useIsDirty<T extends { id: string }>(
  rawItems: T[],
  itemsMap: Record<string, T>,
): boolean {
  return useMemo(() => {
    const ids = Object.keys(itemsMap);
    if (ids.length !== rawItems.length) return true;
    for (const item of rawItems) {
      if (itemsMap[item.id] !== item) return true;
    }
    return false;
  }, [rawItems, itemsMap]);
}

import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { InventoryItem } from '@chemicalluck/sim-engine/types/item.types';

export const selectContainer = (
  state: RootState,
  containerId: string,
): InventoryItem[] => state.present.containers[containerId] ?? [];

export const selectPlayerInventory = (state: RootState): InventoryItem[] =>
  state.present.containers.player ?? [];

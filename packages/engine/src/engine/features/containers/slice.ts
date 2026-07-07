import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { makeConfig } from '@chemicalluck/engine/lib/core';
import type { InventoryItem } from '@chemicalluck/engine/types/item.types';

export interface ContainerConfig {
  player: InventoryItem[];
}

const _config = makeConfig<ContainerConfig>({ player: [] });

export const configureContainers = _config.configure;

export type ContainerState = Record<string, InventoryItem[] | undefined>;

function makeInitialState(): ContainerState {
  const cfg = _config.get();
  return { player: cfg.player };
}

const containersSlice = createSlice({
  name: 'containers',
  initialState: makeInitialState,
  reducers: {
    depositItem: {
      reducer: (
        state,
        action: PayloadAction<{ containerId: string; item: InventoryItem }>,
      ) => {
        const { containerId, item } = action.payload;
        const container = state[containerId];
        if (container) {
          container.push(item);
        } else {
          state[containerId] = [item];
        }
      },
      prepare: (payload: { containerId: string; item: InventoryItem }) => ({
        payload: {
          containerId: payload.containerId,
          // Clone the incoming item (it may be a shared template object from
          // the item registry) and stamp a fresh per-instance UUID so each
          // deposit yields a distinct object.
          item: {
            ...payload.item,
            instanceId: crypto.randomUUID(),
          },
        },
      }),
    },

    withdrawItem: (
      state,
      action: PayloadAction<{ containerId: string; itemId: string }>,
    ) => {
      const { containerId, itemId } = action.payload;
      const items = state[containerId];
      if (!items) return;
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) return;
      items.splice(idx, 1);
    },

    clearContainer: (state, action: PayloadAction<{ containerId: string }>) => {
      state[action.payload.containerId] = [];
    },
  },
});

export const { depositItem, withdrawItem, clearContainer } =
  containersSlice.actions;

export default containersSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    containers: ReturnType<typeof containersSlice.reducer>;
  }
}

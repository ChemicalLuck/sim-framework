import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ClothingState, DIRTY_THRESHOLD_MINUTES } from './types';

const initialState: ClothingState = {};

const clothingSlice = createSlice({
  name: 'clothing',
  initialState,
  reducers: {
    ensureItems: (state, action: PayloadAction<string[]>) => {
      for (const id of action.payload) {
        state[id] ??= { isWet: false, isDirty: false, wearMinutes: 0 };
      }
    },

    addWearMinutes: (
      state,
      action: PayloadAction<{ ids: string[]; minutes: number }>,
    ) => {
      const { ids, minutes } = action.payload;
      for (const id of ids) {
        const item = state[id];
        if (item) {
          item.wearMinutes += minutes;
          if (item.wearMinutes >= DIRTY_THRESHOLD_MINUTES) {
            item.isDirty = true;
          }
        } else {
          state[id] = {
            isWet: false,
            isDirty: minutes >= DIRTY_THRESHOLD_MINUTES,
            wearMinutes: minutes,
          };
        }
      }
    },

    setWet: (state, action: PayloadAction<{ ids: string[]; wet: boolean }>) => {
      const { ids, wet } = action.payload;
      for (const id of ids) {
        const item = state[id];
        if (item) {
          item.isWet = wet;
        } else {
          state[id] = { isWet: wet, isDirty: false, wearMinutes: 0 };
        }
      }
    },

    cleanItems: (state, action: PayloadAction<{ ids: string[] | '*' }>) => {
      const { ids } = action.payload;
      const targets = ids === '*' ? Object.keys(state) : ids;
      for (const id of targets) {
        state[id] = { isWet: false, isDirty: false, wearMinutes: 0 };
      }
    },
  },
});

export const { ensureItems, addWearMinutes, setWet, cleanItems } =
  clothingSlice.actions;

export default clothingSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    clothing: ReturnType<typeof clothingSlice.reducer>;
  }
}

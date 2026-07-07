import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { Outfit } from './types';

const initialState: Outfit[] = [];

const outfitsSlice = createSlice({
  name: 'outfits',
  initialState,
  reducers: {
    addOutfit: (state, action: PayloadAction<Outfit>) => {
      const outfit = action.payload;

      const index = state.findIndex((o) => o.name === outfit.name);
      if (index !== -1) {
        state.splice(index, 1);
      }
      state.push(outfit);
    },
    removeOutfitByName: (state, action: PayloadAction<string>) => {
      return state.filter((o) => o.name !== action.payload);
    },
  },
});

export const { addOutfit, removeOutfitByName } = outfitsSlice.actions;

export default outfitsSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    outfits: ReturnType<typeof outfitsSlice.reducer>;
  }
}

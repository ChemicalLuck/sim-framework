import type { RootState } from '@chemicalluck/engine/state/store';

export const selectOutfits = (state: RootState) => {
  return state.present.outfits;
};

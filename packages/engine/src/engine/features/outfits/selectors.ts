import type { RootState } from '@sim/engine/state/store';

export const selectOutfits = (state: RootState) => {
  return state.present.outfits;
};

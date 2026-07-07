import type { RootState } from '@chemicalluck/sim-engine/state/store';

export const selectOutfits = (state: RootState) => {
  return state.present.outfits;
};

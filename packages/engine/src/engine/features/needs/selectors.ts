import type { RootState } from '@chemicalluck/sim-engine/state/store';

export const selectNeeds = (state: RootState) => {
  return state.present.needs;
};

import type { RootState } from '@sim/engine/state/store';

export const selectNeeds = (state: RootState) => {
  return state.present.needs;
};

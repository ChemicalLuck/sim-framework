import type { RootState } from '@chemicalluck/engine/state/store';

export const selectNeeds = (state: RootState) => {
  return state.present.needs;
};

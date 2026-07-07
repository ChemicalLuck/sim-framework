import type { RootState } from '@chemicalluck/sim-engine/state/store';

export const selectMoney = (state: RootState) => {
  return state.present.money;
};

import type { RootState } from '@sim/engine/state/store';

export const selectMoney = (state: RootState) => {
  return state.present.money;
};

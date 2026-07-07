import type { RootState } from '@chemicalluck/engine/state/store';

export const selectMoney = (state: RootState) => {
  return state.present.money;
};

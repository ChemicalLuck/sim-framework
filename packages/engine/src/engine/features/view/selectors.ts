import type { RootState } from '@chemicalluck/engine/state/store';

export const selectView = (state: RootState) => {
  return state.present.view;
};

export const selectDescription = (state: RootState) => {
  return state.present.view.description;
};

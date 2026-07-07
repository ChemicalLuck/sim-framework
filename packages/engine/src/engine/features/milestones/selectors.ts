import type { RootState } from '@chemicalluck/engine/state/store';

export const selectMilestones = (state: RootState) =>
  state.present.milestones.achieved;

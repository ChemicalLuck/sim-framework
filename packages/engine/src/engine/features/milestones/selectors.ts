import type { RootState } from '@sim/engine/state/store';

export const selectMilestones = (state: RootState) =>
  state.present.milestones.achieved;

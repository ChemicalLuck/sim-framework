import type { RootState } from '@chemicalluck/sim-engine/state/store';

export const selectMilestones = (state: RootState) =>
  state.present.milestones.achieved;

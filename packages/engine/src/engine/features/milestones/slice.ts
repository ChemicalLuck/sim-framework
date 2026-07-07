import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { Milestone } from './types';

interface MilestonesState {
  definitions: Milestone[];
  achieved: string[];
}

const milestonesSlice = createSlice({
  name: 'milestones',
  initialState: { definitions: [], achieved: [] } as MilestonesState,
  reducers: {
    loadMilestones: (state, action: PayloadAction<Milestone[]>) => {
      state.definitions = action.payload;
    },
    addMilestone: (state, action: PayloadAction<string>) => {
      if (!state.achieved.includes(action.payload)) {
        state.achieved.push(action.payload);
      }
    },
  },
});

export const { loadMilestones, addMilestone } = milestonesSlice.actions;

export default milestonesSlice.reducer;

declare module '@chemicalluck/engine/state/store' {
  interface PresentState {
    milestones: ReturnType<typeof milestonesSlice.reducer>;
  }
}

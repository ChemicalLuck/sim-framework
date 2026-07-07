import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type {
  NpcRelationship,
  RelationshipMetric,
} from '@sim/engine/features/npcs/types';

type RelationshipsState = Record<string, NpcRelationship>;

const DEFAULT_RELATIONSHIP: NpcRelationship = {
  relationship: { Friendship: 0, Romance: 0, Attraction: 0 },
};

const initialState: RelationshipsState = {};

const relationshipsSlice = createSlice({
  name: 'relationships',
  initialState,
  reducers: {
    meetNpc: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state[id]) state[id] = { ...DEFAULT_RELATIONSHIP }; // eslint-disable-line
    },
    updateRelationshipMetric: (
      state,
      action: PayloadAction<{
        npcId: string;
        metric: RelationshipMetric;
        delta: number;
      }>,
    ) => {
      const { npcId, metric, delta } = action.payload;
      if (!state[npcId]) state[npcId] = { ...DEFAULT_RELATIONSHIP }; // eslint-disable-line
      state[npcId].relationship[metric] += delta;
    },
  },
});

export const { meetNpc, updateRelationshipMetric } = relationshipsSlice.actions;

export const DEFAULT_NPC_RELATIONSHIP = DEFAULT_RELATIONSHIP;

export default relationshipsSlice.reducer;

declare module '@sim/engine/state/store' {
  interface PresentState {
    relationships: ReturnType<typeof relationshipsSlice.reducer>;
  }
}

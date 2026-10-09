import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type {
  NpcRelationship,
  RelationshipMetric,
} from '@chemicalluck/sim-engine/features/npcs/types';
import { makeConfig } from '@chemicalluck/sim-engine/lib/core';

type RelationshipsState = Record<string, NpcRelationship>;

export interface RelationshipsConfig {
  /** Lowest value a metric can reach (default 0). */
  min?: number;
  /** Highest value a metric can reach (default 100). */
  max?: number;
}

const _config = makeConfig<Required<RelationshipsConfig>>({ min: 0, max: 100 });

export function configureRelationships(config: RelationshipsConfig) {
  _config.configure({ min: 0, max: 100, ...config });
}

export function getRelationshipBounds(): Required<RelationshipsConfig> {
  return _config.get();
}

const DEFAULT_RELATIONSHIP: NpcRelationship = {
  relationship: { Friendship: 0, Romance: 0, Attraction: 0 },
};

function newRelationship(): NpcRelationship {
  return { relationship: { ...DEFAULT_RELATIONSHIP.relationship } };
}

const initialState: RelationshipsState = {};

const relationshipsSlice = createSlice({
  name: 'relationships',
  initialState,
  reducers: {
    meetNpc: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state[id]) state[id] = newRelationship(); // eslint-disable-line
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
      if (!state[npcId]) state[npcId] = newRelationship(); // eslint-disable-line
      const { min, max } = _config.get();
      const next = state[npcId].relationship[metric] + delta;
      state[npcId].relationship[metric] = Math.min(max, Math.max(min, next));
    },
  },
});

export const { meetNpc, updateRelationshipMetric } = relationshipsSlice.actions;

export const DEFAULT_NPC_RELATIONSHIP = DEFAULT_RELATIONSHIP;

export default relationshipsSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    relationships: ReturnType<typeof relationshipsSlice.reducer>;
  }
}

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { Encounter } from '@chemicalluck/sim-engine/features/encounter/types';
import { clampAdd } from '@chemicalluck/sim-engine/lib/maths';

export interface EncounterSliceState {
  encounter: Encounter | null;
  npcId: string | null;
  currentStateId: string | null;
  playerActiveActions: Record<string, string | null>;
  npcActiveActions: Record<string, string | null>;
  npcNeeds: Record<string, number>;
}

export const ENCOUNTER_INITIAL_STATE: EncounterSliceState = {
  encounter: null,
  npcId: null,
  currentStateId: null,
  playerActiveActions: {},
  npcActiveActions: {},
  npcNeeds: {},
};

const encounterSlice = createSlice({
  name: 'encounter',
  initialState: ENCOUNTER_INITIAL_STATE,
  reducers: {
    startEncounter: (
      state,
      action: PayloadAction<{ encounter: Encounter; npcId: string }>,
    ) => {
      const { encounter, npcId } = action.payload;
      state.encounter = encounter;
      state.npcId = npcId;
      state.currentStateId = encounter.initialStateId;
      state.playerActiveActions = {};
      state.npcActiveActions = {};
      state.npcNeeds = { ...(encounter.npcNeeds ?? {}) };
    },

    stopEncounter: () => ENCOUNTER_INITIAL_STATE,

    setPlayerAction: (
      state,
      action: PayloadAction<{ bodyPart: string; actionId: string | null }>,
    ) => {
      const { bodyPart, actionId } = action.payload;
      state.playerActiveActions[bodyPart] = actionId;
    },

    setNpcAction: (
      state,
      action: PayloadAction<{ bodyPart: string; actionId: string | null }>,
    ) => {
      const { bodyPart, actionId } = action.payload;
      state.npcActiveActions[bodyPart] = actionId;
    },

    setEncounterState: (state, action: PayloadAction<string>) => {
      state.currentStateId = action.payload;
    },

    updateNpcNeed: (
      state,
      action: PayloadAction<{ need: string; delta: number }>,
    ) => {
      const { need, delta } = action.payload;
      if (need in state.npcNeeds) {
        state.npcNeeds[need] = clampAdd(state.npcNeeds[need], delta);
      }
    },
  },
});

export const {
  startEncounter,
  stopEncounter,
  setPlayerAction,
  setNpcAction,
  setEncounterState,
  updateNpcNeed,
} = encounterSlice.actions;

export default encounterSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    encounter: ReturnType<typeof encounterSlice.reducer>;
  }
}

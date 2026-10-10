import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { Encounter } from '@chemicalluck/sim-engine/features/encounter/types';
import { clampAdd } from '@chemicalluck/sim-engine/lib/maths';

/** One NPC's transient state for the duration of an encounter. */
export interface EncounterNpcState {
  activeActions: Record<string, string | null>;
  needs: Record<string, number>;
  /** The NPC has left (picked an `npcStop` action) while others remain. */
  left: boolean;
}

export interface EncounterSliceState {
  encounter: Encounter | null;
  /** Participating NPCs by slot (fixed for the encounter, left ones included). */
  npcIds: string[];
  npcs: Record<string, EncounterNpcState>;
  /** The first NPC still present — what un-slotted forms refer to. */
  npcId: string | null;
  currentStateId: string | null;
  playerActiveActions: Record<string, string | null>;
  /** Mirror of the first present NPC's `activeActions`. */
  npcActiveActions: Record<string, string | null>;
  /** Mirror of the first present NPC's `needs`. */
  npcNeeds: Record<string, number>;
}

export const ENCOUNTER_INITIAL_STATE: EncounterSliceState = {
  encounter: null,
  npcIds: [],
  npcs: {},
  npcId: null,
  currentStateId: null,
  playerActiveActions: {},
  npcActiveActions: {},
  npcNeeds: {},
};

/** NPC ids still in the encounter, in slot order. */
export function presentNpcIds(state: {
  npcIds?: string[];
  npcs?: Record<string, EncounterNpcState>;
}): string[] {
  return (state.npcIds ?? []).filter((id) => state.npcs?.[id]?.left === false);
}

/**
 * Mirror the first NPC still present into the legacy single-NPC fields. An
 * encounter started without NPCs keeps using those fields directly.
 */
function syncPrimary(state: EncounterSliceState) {
  if (!state.npcIds.length) return;
  const primary = presentNpcIds(state)[0] ?? null;
  state.npcId = primary;
  state.npcActiveActions = primary
    ? { ...state.npcs[primary].activeActions }
    : {};
  state.npcNeeds = primary ? { ...state.npcs[primary].needs } : {};
}

/** The NPC a payload names, or the first one still present. */
function targetNpc(state: EncounterSliceState, npcId?: string) {
  const id = npcId ?? presentNpcIds(state)[0];
  return id ? state.npcs[id] : undefined;
}

const encounterSlice = createSlice({
  name: 'encounter',
  initialState: ENCOUNTER_INITIAL_STATE,
  reducers: {
    startEncounter: (
      state,
      action: PayloadAction<{
        encounter: Encounter;
        npcId?: string;
        npcIds?: string[];
      }>,
    ) => {
      const { encounter, npcId, npcIds } = action.payload;
      const ids = [...new Set(npcIds ?? (npcId ? [npcId] : []))];
      state.encounter = encounter;
      state.npcIds = ids;
      state.npcs = Object.fromEntries(
        ids.map((id) => [
          id,
          {
            activeActions: {},
            needs: { ...(encounter.npcNeeds ?? {}) },
            left: false,
          },
        ]),
      );
      state.currentStateId = encounter.initialStateId;
      state.playerActiveActions = {};
      state.npcId = null;
      state.npcActiveActions = {};
      state.npcNeeds = { ...(encounter.npcNeeds ?? {}) };
      syncPrimary(state);
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
      action: PayloadAction<{
        bodyPart: string;
        actionId: string | null;
        /** Defaults to the first NPC still present. */
        npcId?: string;
      }>,
    ) => {
      const { bodyPart, actionId, npcId } = action.payload;
      const npc = targetNpc(state, npcId);
      if (npc) npc.activeActions[bodyPart] = actionId;
      else state.npcActiveActions[bodyPart] = actionId;
      syncPrimary(state);
    },

    /** An NPC leaves; the encounter goes on with the others. */
    npcLeaveEncounter: (state, action: PayloadAction<string>) => {
      const npc = state.npcs[action.payload] as EncounterNpcState | undefined;
      if (!npc) return;
      npc.left = true;
      npc.activeActions = {};
      syncPrimary(state);
    },

    setEncounterState: (state, action: PayloadAction<string>) => {
      state.currentStateId = action.payload;
    },

    updateNpcNeed: (
      state,
      action: PayloadAction<{
        need: string;
        delta: number;
        /** Defaults to the first NPC still present. */
        npcId?: string;
      }>,
    ) => {
      const { need, delta, npcId } = action.payload;
      const npc = targetNpc(state, npcId);
      const needs = npc ? npc.needs : state.npcNeeds;
      if (need in needs) {
        needs[need] = clampAdd(needs[need], delta);
      }
      syncPrimary(state);
    },
  },
});

export const {
  startEncounter,
  stopEncounter,
  setPlayerAction,
  setNpcAction,
  npcLeaveEncounter,
  setEncounterState,
  updateNpcNeed,
} = encounterSlice.actions;

export default encounterSlice.reducer;

declare module '@chemicalluck/sim-engine/state/store' {
  interface PresentState {
    encounter: ReturnType<typeof encounterSlice.reducer>;
  }
}

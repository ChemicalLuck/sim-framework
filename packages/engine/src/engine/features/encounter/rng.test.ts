import {
  type Reducer,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import { describe, expect, it } from 'vitest';

import type { Encounter } from '@chemicalluck/sim-engine/features/encounter/types';
import npcsReducer from '@chemicalluck/sim-engine/features/npcs/slice';
import { rngSyncMiddleware } from '@chemicalluck/sim-engine/features/rng/middleware';
import rngReducer, {
  setGameSeed,
} from '@chemicalluck/sim-engine/features/rng/slice';
import type { EngineDispatch } from '@chemicalluck/sim-engine/state/store';

import encounterReducer, { setNpcAction, startEncounter } from './slice';
import { processTurn } from './thunks';

const encounter: Encounter = {
  kind: 'encounter',
  id: 'chat',
  name: 'Chat',
  initialStateId: 's',
  states: [
    {
      id: 's',
      name: 'S',
      text: '',
      actions: ['a', 'b', 'c', 'd'].map((id) => ({
        id,
        text: id,
        bodyPart: 'hands',
      })),
    },
  ],
};

function npcPicks(seed: number, turns = 30): (string | null)[] {
  const store = configureStore({
    reducer: undoable(
      combineReducers({
        encounter: encounterReducer,
        npcs: npcsReducer,
        rng: rngReducer,
      } as Record<string, Reducer<unknown>>),
    ),
    middleware: (gdm) =>
      gdm({ serializableCheck: false }).concat(rngSyncMiddleware),
  });
  const dispatch = store.dispatch as EngineDispatch;
  dispatch(setGameSeed(seed));
  dispatch(startEncounter({ encounter, npcId: 'nobody' }));

  const picks: (string | null)[] = [];
  for (let i = 0; i < turns; i++) {
    dispatch(setNpcAction({ bodyPart: 'hands', actionId: null }));
    dispatch(processTurn());
    const { present } = store.getState() as {
      present: {
        encounter: { npcActiveActions: Record<string, string | null> };
      };
    };
    picks.push(present.encounter.npcActiveActions.hands ?? null);
  }
  return picks;
}

describe('encounter NPC picks', () => {
  it('are reproducible from the game seed', () => {
    expect(npcPicks(1234)).toEqual(npcPicks(1234));
  });

  it('differ between seeds', () => {
    expect(npcPicks(1234)).not.toEqual(npcPicks(98765));
  });
});

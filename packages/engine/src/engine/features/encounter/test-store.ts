import {
  type Reducer,
  combineReducers,
  configureStore,
} from '@reduxjs/toolkit';
import undoable from 'redux-undo';
import {
  effectHandlers,
  postEffectHandlers,
  slices,
} from 'virtual:game-extensions';

import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import type {
  EngineDispatch,
  RootState,
} from '@chemicalluck/sim-engine/state/store';
import { initProcessEffects } from '@chemicalluck/sim-engine/state/thunks';

/**
 * Test-only engine store for encounter thunks: the real feature slices and
 * effect handlers, seeded with the given NPCs (no persistence, no game data).
 */
export function createEncounterTestStore(npcs: NPC[] = []) {
  initProcessEffects(effectHandlers, postEffectHandlers);
  const reducer = undoable(
    combineReducers(slices as Record<string, Reducer<unknown>>),
    { limit: 1 },
  );
  const initial = reducer(undefined, { type: '@@INIT' }).present as Record<
    string,
    unknown
  >;
  const present = {
    ...initial,
    npcs: { ...(initial.npcs as object), characters: npcs },
  };
  const store = configureStore({
    reducer,
    preloadedState: { past: [], present, future: [] },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
  return {
    store,
    dispatch: store.dispatch as EngineDispatch,
    getState: () => store.getState() as unknown as RootState,
  };
}

export function makeTestNpc(id: string, overrides: Partial<NPC> = {}): NPC {
  return {
    id,
    profile: {
      firstName: id,
      lastName: 'Test',
      profession: 'student',
      age: 20,
      appearance: {},
    },
    equipment: {},
    skills: {},
    traits: [],
    pronouns: {
      subject: 'they',
      object: 'them',
      possessive: 'their',
      reflexive: 'themself',
      noun: 'person',
    },
    ...overrides,
  };
}

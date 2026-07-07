import { describe, expect, it } from 'vitest';

import reducer, {
  ENCOUNTER_INITIAL_STATE,
  setEncounterState,
  setNpcAction,
  setPlayerAction,
  startEncounter,
  stopEncounter,
  updateNpcNeed,
} from './slice';
import type { Encounter } from './types';

const encounter: Encounter = {
  id: 'dorm_room',
  initialStateId: 'idle',
  states: [],
  npcNeeds: { Arousal: 50 },
} as unknown as Encounter;

describe('encounter slice', () => {
  it('starts in the empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(
      ENCOUNTER_INITIAL_STATE,
    );
  });

  it('startEncounter seeds encounter, npcId, currentStateId and npcNeeds', () => {
    const next = reducer(
      undefined,
      startEncounter({ encounter, npcId: 'alice' }),
    );
    expect(next.encounter).toEqual(encounter);
    expect(next.npcId).toBe('alice');
    expect(next.currentStateId).toBe('idle');
    expect(next.npcNeeds).toEqual({ Arousal: 50 });
  });

  it('startEncounter copies needs (does not share the encounter reference)', () => {
    const next = reducer(
      undefined,
      startEncounter({ encounter, npcId: 'alice' }),
    );
    expect(next.npcNeeds).not.toBe(encounter.npcNeeds);
  });

  it('stopEncounter resets to initial state', () => {
    const started = reducer(
      undefined,
      startEncounter({ encounter, npcId: 'alice' }),
    );
    expect(reducer(started, stopEncounter())).toEqual(ENCOUNTER_INITIAL_STATE);
  });

  it('setPlayerAction and setNpcAction store by body part', () => {
    let state = reducer(undefined, startEncounter({ encounter, npcId: 'a' }));
    state = reducer(
      state,
      setPlayerAction({ bodyPart: 'hands', actionId: 'hold' }),
    );
    state = reducer(
      state,
      setNpcAction({ bodyPart: 'eyes', actionId: 'look' }),
    );
    expect(state.playerActiveActions.hands).toBe('hold');
    expect(state.npcActiveActions.eyes).toBe('look');
  });

  it('setEncounterState changes the current state id', () => {
    const started = reducer(
      undefined,
      startEncounter({ encounter, npcId: 'a' }),
    );
    const next = reducer(started, setEncounterState('engaged'));
    expect(next.currentStateId).toBe('engaged');
  });

  it('updateNpcNeed clamps within 0-100 and only mutates known needs', () => {
    const started = reducer(
      undefined,
      startEncounter({ encounter, npcId: 'a' }),
    );
    const upped = reducer(
      started,
      updateNpcNeed({ need: 'Arousal', delta: 60 }),
    );
    expect(upped.npcNeeds.Arousal).toBe(100);

    const unknown = reducer(
      started,
      updateNpcNeed({ need: 'Missing', delta: 10 }),
    );
    expect(unknown.npcNeeds).toEqual({ Arousal: 50 });
  });
});

import { describe, expect, it } from 'vitest';

import reducer, {
  npcLeaveEncounter,
  presentNpcIds,
  setNpcAction,
  startEncounter,
  updateNpcNeed,
} from './slice';
import type { Encounter } from './types';

const encounter = {
  id: 'party',
  initialStateId: 'idle',
  states: [],
  npcNeeds: { Energy: 50 },
} as unknown as Encounter;

function started() {
  return reducer(
    undefined,
    startEncounter({ encounter, npcIds: ['a', 'b', 'c'] }),
  );
}

describe('encounter slice with several NPCs', () => {
  it('seeds per-NPC state in slot order, the first NPC mirrored', () => {
    const state = started();
    expect(state.npcIds).toEqual(['a', 'b', 'c']);
    expect(state.npcs.b).toEqual({
      activeActions: {},
      needs: { Energy: 50 },
      left: false,
    });
    expect(state.npcs.a.needs).not.toBe(state.npcs.b.needs);
    expect(state.npcId).toBe('a');
    expect(state.npcNeeds).toEqual({ Energy: 50 });
  });

  it('scopes actions and needs to the named NPC', () => {
    let state = started();
    state = reducer(
      state,
      setNpcAction({ bodyPart: 'hands', actionId: 'wave', npcId: 'b' }),
    );
    state = reducer(
      state,
      updateNpcNeed({ need: 'Energy', delta: -20, npcId: 'c' }),
    );
    expect(state.npcs.b.activeActions.hands).toBe('wave');
    expect(state.npcs.a.activeActions).toEqual({});
    expect(state.npcs.c.needs.Energy).toBe(30);
    expect(state.npcs.a.needs.Energy).toBe(50);
    expect(state.npcActiveActions).toEqual({});
  });

  it('defaults unscoped updates to the first NPC still present', () => {
    let state = started();
    state = reducer(state, updateNpcNeed({ need: 'Energy', delta: 10 }));
    expect(state.npcs.a.needs.Energy).toBe(60);
    expect(state.npcNeeds.Energy).toBe(60);
  });

  it('lets an NPC leave while the others stay', () => {
    let state = started();
    state = reducer(
      state,
      setNpcAction({ bodyPart: 'hands', actionId: 'wave', npcId: 'a' }),
    );
    state = reducer(state, npcLeaveEncounter('a'));
    expect(presentNpcIds(state)).toEqual(['b', 'c']);
    expect(state.npcs.a.left).toBe(true);
    expect(state.npcs.a.activeActions).toEqual({});
    expect(state.npcId).toBe('b');
    expect(state.npcIds).toEqual(['a', 'b', 'c']);
  });
});

import { combineReducers } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { beforeEach, describe, expect, it } from 'vitest';

import relationshipsReducer, {
  meetNpc,
} from '@chemicalluck/sim-engine/features/relationships/slice';
import rngReducer, {
  setGameSeed,
} from '@chemicalluck/sim-engine/features/rng/slice';
import { createCompactTransform } from '@chemicalluck/sim-engine/state/store';

import { configureAppearance } from './lib/appearance-config';
import { setNamedNpcs } from './lib/named-npcs';
import { initNpcNames } from './lib/npcs';
import { configureProfessions } from './lib/professions';
import reducer, { generateNPCs, regenerateNpcs, setNearby } from './slice';

// `regenerateNpcs` generates 10000 NPCs via createNpc + Mulberry32 and pulls
// in named-npcs data; covering it here is heavy and brittle. Slice behaviour
// for that action is exercised indirectly through hydrate/integration paths.

describe('npcs slice', () => {
  it('starts with seed 0 and empty collections', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      seed: 0,
      characters: [],
      named: [],
      nearby: [],
    });
  });

  it('setNearby replaces the nearby ids', () => {
    const next = reducer(
      { seed: 0, characters: [], named: [], nearby: ['alice'] },
      setNearby(['bob', 'charlie']),
    );
    expect(next.nearby).toEqual(['bob', 'charlie']);
  });
});

beforeEach(() => {
  configureAppearance({
    features: [
      {
        id: 'gender',
        label: 'Gender',
        values: ['Male', 'Female'],
        isDimension: true,
        weights: { default: { Male: 1, Female: 1 } },
      },
    ],
    ageDistribution: { min: 18, max: 80, mean: 30, stdDev: 10 },
    bodyAttributes: [],
    display: { strangerFeatureIds: [], metaFeatureIds: [] },
  });
  initNpcNames({ male: ['Bob'], female: ['Alice'], surnames: ['Smith'] });
  configureProfessions({ professions: ['Student'] });
});

describe('procedural NPC ids', () => {
  const ids = (seed: number) => generateNPCs(seed, 50).map((n) => n.id);

  it('are identical when generated twice from the same seed', () => {
    expect(ids(42)).toEqual(ids(42));
  });

  it('are unique within a generation and differ between seeds', () => {
    expect(new Set(ids(42)).size).toBe(50);
    expect(ids(43).some((id) => ids(42).includes(id))).toBe(false);
  });

  it('do not depend on how many NPCs are generated', () => {
    expect(
      generateNPCs(42, 60)
        .slice(0, 50)
        .map((n) => n.id),
    ).toEqual(ids(42));
  });
});

describe('procedural NPC relationships across save and reload', () => {
  const game = combineReducers({
    npcs: reducer,
    relationships: relationshipsReducer,
    rng: rngReducer,
  });
  type GameState = ReturnType<typeof game>;

  it('still resolve to the same regenerated NPC', () => {
    // Named NPC ids come from content and must be left as they are.
    setNamedNpcs([{ id: 'alice' }] as never);

    let present = game(undefined, { type: '@@INIT' });
    present = game(present, setGameSeed(42));
    present = game(present, regenerateNpcs(42));
    const npc = present.npcs.characters[3];
    present = game(present, meetNpc(npc.id));

    // Save: what the persist transform writes (procedural NPCs stripped).
    const saved = JSON.parse(
      JSON.stringify(createCompactTransform().in(present, 'present', {})),
    ) as GameState;
    expect(saved.npcs.characters).toEqual([]);
    expect(saved.relationships[npc.id]).toBeDefined();

    // Reload: NPCs are regenerated from the saved seed.
    const reloaded = reducer(undefined, {
      type: REHYDRATE,
      key: 'root',
      payload: { present: saved },
    });
    expect(reloaded.characters.find((c) => c.id === npc.id)).toEqual(npc);
    expect(reloaded.named.map((n) => n.id)).toEqual(['alice']);
  }, 30000);
});

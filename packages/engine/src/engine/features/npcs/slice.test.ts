import { describe, expect, it } from 'vitest';

import reducer, { setNearby } from './slice';

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

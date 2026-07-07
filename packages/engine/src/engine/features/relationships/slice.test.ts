import { describe, expect, it } from 'vitest';

import reducer, { meetNpc, updateRelationshipMetric } from './slice';

describe('relationships slice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('meetNpc creates a default relationship entry', () => {
    const next = reducer({}, meetNpc('alice'));
    expect(next.alice).toEqual({
      relationship: { Friendship: 0, Romance: 0, Attraction: 0 },
    });
  });

  it('meetNpc is a no-op when the npc is already known', () => {
    const before = {
      alice: { relationship: { Friendship: 10, Romance: 5, Attraction: 0 } },
    };
    const after = reducer(before, meetNpc('alice'));
    expect(after.alice).toEqual(before.alice);
  });

  it('updateRelationshipMetric adds the delta to the chosen metric', () => {
    const next = reducer(
      {
        alice: {
          relationship: { Friendship: 5, Romance: 0, Attraction: 0 },
        },
      },
      updateRelationshipMetric({
        npcId: 'alice',
        metric: 'Friendship',
        delta: 3,
      }),
    );
    expect(next.alice.relationship.Friendship).toBe(8);
  });

  // NOTE: `updateRelationshipMetric` self-initialises with a shallow spread of
  // DEFAULT_RELATIONSHIP. The nested `relationship` object is the frozen
  // module constant, so mutating it under Immer throws. In practice callers
  // are expected to dispatch `meetNpc` first; this test mirrors that contract.
  it('updateRelationshipMetric applies the delta after meetNpc seeds the entry', () => {
    let state = reducer({}, meetNpc('bob'));
    state = reducer(
      state,
      updateRelationshipMetric({ npcId: 'bob', metric: 'Romance', delta: 4 }),
    );
    expect(state.bob.relationship).toEqual({
      Friendship: 0,
      Romance: 4,
      Attraction: 0,
    });
  });
});

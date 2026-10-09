import { afterEach, describe, expect, it } from 'vitest';

import reducer, {
  configureRelationships,
  meetNpc,
  updateRelationshipMetric,
} from './slice';

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

describe('relationship metric bounds', () => {
  afterEach(() => {
    configureRelationships({});
  });

  const at = (Friendship: number) => ({
    alice: { relationship: { Friendship, Romance: 0, Attraction: 0 } },
  });
  const delta = (d: number) =>
    updateRelationshipMetric({
      npcId: 'alice',
      metric: 'Friendship',
      delta: d,
    });

  it('clamps to 0–100 by default', () => {
    expect(reducer(at(95), delta(20)).alice.relationship.Friendship).toBe(100);
    expect(reducer(at(5), delta(-20)).alice.relationship.Friendship).toBe(0);
  });

  it('clamps to a configured range', () => {
    configureRelationships({ min: -50, max: 200 });
    expect(reducer(at(190), delta(20)).alice.relationship.Friendship).toBe(200);
    expect(reducer(at(0), delta(-80)).alice.relationship.Friendship).toBe(-50);
  });

  it('self-initialises an unknown npc without touching the defaults', () => {
    const next = reducer({}, delta(7));
    expect(next.alice.relationship.Friendship).toBe(7);
    expect(reducer({}, meetNpc('bob')).bob.relationship.Friendship).toBe(0);
  });
});

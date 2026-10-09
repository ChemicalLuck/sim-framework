import { describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import {
  isConditionMet,
  parseCondition,
} from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

function makeState(
  view: { activeViewId: string; props: Record<string, unknown> },
  encounterNpc: string | null = null,
): RootState {
  return {
    present: {
      view: { ...view, description: '' },
      encounter: { npcId: encounterNpc },
      relationships: {
        alice: { relationship: { Friendship: 40, Romance: 10, Attraction: 0 } },
        bob: { relationship: { Friendship: 5, Romance: 0, Attraction: 0 } },
      },
    },
  } as unknown as RootState;
}

describe('relationship expressions', () => {
  it('parses current-NPC and specific-NPC forms', () => {
    expect(parseCondition('relationship.Friendship >= 30')).toEqual({
      kind: 'gte',
      lhs: { kind: 'relationship', metric: 'Friendship' },
      rhs: { kind: 'const', value: 30 },
    });
    expect(parseCondition('relationship.alice.Romance > 5')).toEqual({
      kind: 'gt',
      lhs: { kind: 'relationship', npcId: 'alice', metric: 'Romance' },
      rhs: { kind: 'const', value: 5 },
    });
  });

  it('rejects unknown metrics', () => {
    expect(() => parseCondition('relationship.Trust > 1')).toThrow();
  });

  it('round-trips through the serializer', () => {
    for (const s of [
      'relationship.Friendship >= 30',
      'relationship.alice.Romance > 5',
    ]) {
      expect(conditionToString(parseCondition(s))).toBe(s);
    }
  });

  it('evaluates against a specific NPC', () => {
    const state = makeState({ activeViewId: 'DefaultView', props: {} });
    expect(
      isConditionMet(
        state,
        parseCondition('relationship.alice.Friendship >= 30'),
      ),
    ).toBe(true);
    expect(
      isConditionMet(
        state,
        parseCondition('relationship.bob.Friendship >= 30'),
      ),
    ).toBe(false);
    expect(
      isConditionMet(
        state,
        parseCondition('relationship.carol.Friendship == 0'),
      ),
    ).toBe(true);
  });

  it.each([
    ['SceneView', { npcIds: ['alice'] }],
    ['ScriptView', { npcIds: ['alice', 'bob'] }],
    ['NpcView', { npcId: 'alice' }],
    ['ConversationView', { npcId: 'alice' }],
  ])('uses the current NPC in %s', (activeViewId, props) => {
    const state = makeState({ activeViewId, props });
    expect(
      isConditionMet(state, parseCondition('relationship.Friendship >= 30')),
    ).toBe(true);
  });

  it('uses the encounter NPC', () => {
    const state = makeState(
      { activeViewId: 'EncounterView', props: {} },
      'alice',
    );
    expect(
      isConditionMet(state, parseCondition('relationship.Friendship >= 30')),
    ).toBe(true);
  });

  it('is 0 when there is no current NPC', () => {
    const state = makeState({ activeViewId: 'DefaultView', props: {} });
    expect(
      isConditionMet(state, parseCondition('relationship.Friendship == 0')),
    ).toBe(true);
  });
});

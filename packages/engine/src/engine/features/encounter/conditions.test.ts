import { describe, expect, it } from 'vitest';

import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import {
  isConditionMet,
  parseCondition,
} from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { withEncounterActor } from './lib/actor';
import { makeTestNpc } from './test-store';

function makeState(): RootState {
  return {
    present: {
      view: { activeViewId: 'EncounterView', props: {}, description: '' },
      player: { skills: { charm: 2 } },
      needs: { Energy: 80 },
      npcs: {
        named: [],
        characters: [makeTestNpc('alice', { skills: { charm: 9 } })],
      },
      encounter: { npcId: 'alice', npcNeeds: { Energy: 15 } },
      relationships: {
        alice: { relationship: { Friendship: 40, Romance: 10, Attraction: 0 } },
      },
    },
  } as unknown as RootState;
}

describe('encounter actor expressions', () => {
  it('parses and serializes self.* and npc.* forms', () => {
    for (const src of [
      'self.skill.charm >= 3',
      'self.need.Energy < 20',
      'npc.skill.charm > 5',
      'npc.need.Energy <= 0',
      'npc.relationship.Friendship >= 30',
    ]) {
      expect(conditionToString(parseCondition(src))).toBe(src);
    }
    expect(parseCondition('npc.relationship.friendship > 1')).toMatchObject({
      lhs: { kind: 'encounterNpc', stat: 'relationship', key: 'Friendship' },
    });
  });

  it('rejects unknown npc relationship metrics', () => {
    expect(() => parseCondition('npc.relationship.Rivalry > 1')).toThrow();
  });

  it('resolves self.* to the player outside an NPC pick', () => {
    const state = makeState();
    expect(isConditionMet(state, parseCondition('self.skill.charm == 2'))).toBe(
      true,
    );
    expect(
      isConditionMet(state, parseCondition('self.need.Energy == 80')),
    ).toBe(true);
  });

  it('resolves self.* to the NPC during its pick', () => {
    const state = makeState();
    withEncounterActor({ kind: 'npc', npcId: 'alice' }, () => {
      expect(
        isConditionMet(state, parseCondition('self.skill.charm == 9')),
      ).toBe(true);
      expect(
        isConditionMet(state, parseCondition('self.need.Energy == 15')),
      ).toBe(true);
    });
  });

  it('reads the encounter NPC skills, needs and relationship via npc.*', () => {
    const state = makeState();
    expect(
      isConditionMet(
        state,
        parseCondition(
          'npc.skill.charm == 9 && npc.need.Energy == 15 && npc.relationship.Friendship == 40',
        ),
      ),
    ).toBe(true);
  });
});

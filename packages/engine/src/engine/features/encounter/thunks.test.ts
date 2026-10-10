import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_SKILL_MAX,
  configureSkillMax,
} from '@chemicalluck/sim-engine/features/player/lib/skills';

import { startEncounter } from './slice';
import { createEncounterTestStore, makeTestNpc } from './test-store';
import { npcActionWeight, processTurn } from './thunks';
import type { Encounter, EncounterAction } from './types';

afterEach(() => {
  configureSkillMax(DEFAULT_SKILL_MAX);
});

const athletic: EncounterAction = {
  id: 'athletic',
  text: 'Stretch',
  bodyPart: 'hands',
  npcSkillWeights: { athletics: 3 },
};
const plain: EncounterAction = { id: 'plain', text: 'Wave', bodyPart: 'hands' };

function encounterWith(actions: EncounterAction[]): Encounter {
  return {
    kind: 'encounter',
    id: 'enc',
    name: 'Enc',
    initialStateId: 's',
    npcDoNothingWeight: 0,
    states: [{ id: 's', name: 'S', text: '', actions }],
  };
}

describe('npcActionWeight', () => {
  it('applies the full multiplier at the top of the configured skill scale', () => {
    const npc = makeTestNpc('a', { skills: { athletics: DEFAULT_SKILL_MAX } });
    expect(npcActionWeight(athletic, npc)).toBeCloseTo(3);
  });

  it('applies half the multiplier at half the scale', () => {
    const npc = makeTestNpc('a', { skills: { athletics: 5 } });
    expect(npcActionWeight(athletic, npc)).toBeCloseTo(2);
  });

  it('follows a custom skill max', () => {
    configureSkillMax(20);
    const top = makeTestNpc('a', { skills: { athletics: 20 } });
    const mid = makeTestNpc('b', { skills: { athletics: 10 } });
    expect(npcActionWeight(athletic, top)).toBeCloseTo(3);
    expect(npcActionWeight(athletic, mid)).toBeCloseTo(2);
  });

  it('leaves the base weight alone at skill 0', () => {
    const npc = makeTestNpc('a', { skills: { athletics: 0 } });
    expect(npcActionWeight(athletic, npc)).toBe(1);
  });
});

describe('processTurn NPC skill weighting', () => {
  function pickRate(skill: number, turns = 2000): number {
    const npc = makeTestNpc('npc', { skills: { athletics: skill } });
    const { dispatch, getState } = createEncounterTestStore([npc]);
    dispatch(
      startEncounter({
        encounter: encounterWith([athletic, plain]),
        npcId: 'npc',
      }),
    );
    let hits = 0;
    for (let i = 0; i < turns; i++) {
      dispatch(processTurn());
      if (getState().present.encounter.npcActiveActions.hands === 'athletic') {
        hits++;
      }
    }
    return hits / turns;
  }

  it('an NPC at the top skill level picks the weighted action noticeably more often', () => {
    const low = pickRate(0);
    const top = pickRate(DEFAULT_SKILL_MAX);
    // Expected: ~0.5 at skill 0, ~0.75 at the top of the scale.
    expect(low).toBeGreaterThan(0.4);
    expect(low).toBeLessThan(0.6);
    expect(top).toBeGreaterThan(0.68);
    expect(top - low).toBeGreaterThan(0.15);
  });
});

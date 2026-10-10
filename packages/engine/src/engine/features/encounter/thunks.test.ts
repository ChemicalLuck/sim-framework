import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_SKILL_MAX,
  configureSkillMax,
} from '@chemicalluck/sim-engine/features/player/lib/skills';
import { setView } from '@chemicalluck/sim-engine/features/view/slice';
import { parseCondition } from '@chemicalluck/sim-engine/lib/conditions';

import { setPlayerAction, startEncounter } from './slice';
import { createEncounterTestStore, makeTestNpc } from './test-store';
import { npcActionWeight, processTurn, stopEncounterThunk } from './thunks';
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

describe('encounter stops', () => {
  const tire: EncounterAction = {
    id: 'tire',
    text: 'Tire them out',
    bodyPart: 'hands',
    effects: [{ kind: 'needs', target: 'npc', need: 'Energy', delta: -20 }],
  };
  const leave: EncounterAction = {
    id: 'leave',
    text: 'Leave',
    bodyPart: 'feet',
    npcStop: true,
  };

  function stoppable(
    actions: EncounterAction[],
    extra: Partial<Encounter> = {},
  ): Encounter {
    return {
      ...encounterWith(actions),
      npcNeeds: { Energy: 30 },
      stopEffects: [{ kind: 'money', amount: 1 }],
      stopEffectsByReason: {
        player: [{ kind: 'money', amount: 10 }],
        npc: [{ kind: 'money', amount: 100 }],
        condition: [{ kind: 'money', amount: 1000 }],
      },
      ...extra,
    };
  }

  function start(encounter: Encounter) {
    const store = createEncounterTestStore([makeTestNpc('npc')]);
    store.dispatch(startEncounter({ encounter, npcId: 'npc' }));
    store.dispatch(setView({ activeViewId: 'EncounterView', props: {} }));
    return store;
  }

  it('ends without player input once the stop condition is met after a turn', () => {
    // NPC never acts, so only the player's action drains the need.
    const { dispatch, getState } = start(
      stoppable([{ ...tire, condition: parseCondition('money < 0') }], {
        npcDoNothingWeight: 1,
        stopCondition: parseCondition('npcNeed.Energy <= 0'),
      }),
    );
    dispatch(setPlayerAction({ bodyPart: 'hands', actionId: 'tire' }));

    dispatch(processTurn());
    expect(getState().present.encounter.encounter).not.toBeNull();
    expect(getState().present.encounter.npcNeeds.Energy).toBe(10);

    dispatch(processTurn());
    expect(getState().present.encounter.encounter).toBeNull();
    expect(getState().present.view.activeViewId).toBe('DefaultView');
    expect(getState().present.money).toBe(1 + 1000);
  });

  it('supports a stop condition on the current state', () => {
    const encounter = stoppable([tire]);
    const { dispatch, getState } = start({
      ...encounter,
      states: [
        {
          ...encounter.states[0],
          stopCondition: parseCondition('npcNeed.Energy < 50'),
        },
      ],
    });
    dispatch(processTurn());
    expect(getState().present.encounter.encounter).toBeNull();
    expect(getState().present.money).toBe(1 + 1000);
  });

  it('ends when the NPC picks an npcStop action', () => {
    const { dispatch, getState } = start(stoppable([leave]));
    dispatch(processTurn());
    expect(getState().present.encounter.encounter).toBeNull();
    expect(getState().present.view.activeViewId).toBe('DefaultView');
    expect(getState().present.money).toBe(1 + 100);
  });

  it('applies player-specific stop effects when the player stops', () => {
    const { dispatch, getState } = start(stoppable([tire]));
    dispatch(stopEncounterThunk());
    expect(getState().present.encounter.encounter).toBeNull();
    expect(getState().present.view.activeViewId).toBe('DefaultView');
    expect(getState().present.money).toBe(1 + 10);
  });

  it('keeps going while no stop condition is met', () => {
    const { dispatch, getState } = start(
      stoppable([tire], {
        stopCondition: parseCondition('npcNeed.Energy <= 0'),
      }),
    );
    dispatch(processTurn());
    expect(getState().present.encounter.encounter).not.toBeNull();
    expect(getState().present.view.activeViewId).toBe('EncounterView');
  });
});

import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Effect, Scene } from '@chemicalluck/sim-engine/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import postEffects from './post-effects';
import { updateQuestObjective } from './slice';
import type { ObjectiveState, Quest, QuestObjective } from './types';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn() }),
}));
// Record follow-up effect batches instead of running them.
vi.mock('@chemicalluck/sim-engine/state/thunks', () => ({
  processEffects: (effects: Effect[]) => ({
    type: 'test/processEffects',
    payload: effects,
  }),
}));

const [questPostEffect] = postEffects;

const reward: Effect = { kind: 'money', amount: 50 };
const always: Condition = {
  kind: 'eq',
  lhs: { kind: 'const', value: 1 },
  rhs: { kind: 'const', value: 1 },
};
const never: Condition = {
  kind: 'eq',
  lhs: { kind: 'const', value: 1 },
  rhs: { kind: 'const', value: 0 },
};

const cafe: Scene = {
  kind: 'scene',
  text: 'The café.',
  actions: [
    {
      actions: [{ kind: 'action', text: 'Order', effects: [reward] }],
    },
  ],
};
const park: Scene = { kind: 'scene', text: 'The park.', actions: [] };

function quest(
  state: ObjectiveState,
  condition: QuestObjective['condition'],
): Quest {
  return {
    id: 'q',
    name: 'Quest',
    objectives: [{ name: 'o1', state, condition, onComplete: [reward] }],
  };
}

function rootState(
  quests: Quest[],
  view: { activeViewId: string; props: Record<string, unknown> } = {
    activeViewId: 'DefaultView',
    props: {},
  },
): RootState {
  return {
    present: { quests, view: { ...view, description: '' } },
  } as unknown as RootState;
}

function run(prev: RootState, next: RootState) {
  const actions: UnknownAction[] = [];
  const dispatch = vi.fn((a: UnknownAction) => {
    actions.push(a);
    return a;
  });
  questPostEffect({
    dispatch: dispatch as never,
    group: 'g',
    effects: [],
    prevState: prev,
    newState: next,
  });
  const strip = ({ type, payload }: UnknownAction & { payload?: unknown }) => ({
    type,
    payload,
  });
  return actions.map(strip);
}

const firedOnComplete = { type: 'test/processEffects', payload: [reward] };
const completeO1 = updateQuestObjective({
  questId: 'q',
  objectiveName: 'o1',
  objectiveState: 'complete',
});

describe('quests post-effect', () => {
  it('fires onComplete for an objective completed through an action', () => {
    const action = { kind: 'action' as const, text: 'Pay', effects: [] };
    const actions = run(
      rootState([quest('available', action)]),
      rootState([quest('complete', action)]),
    );
    expect(actions).toEqual([firedOnComplete]);
  });

  it('fires onComplete once for a condition objective', () => {
    const actions = run(
      rootState([quest('available', always)]),
      rootState([quest('available', always)]),
    );
    expect(actions).toEqual([completeO1, firedOnComplete]);
  });

  it('does not fire onComplete for an objective that was already complete', () => {
    const actions = run(
      rootState([quest('complete', always)]),
      rootState([quest('complete', always)]),
    );
    expect(actions).toEqual([]);
  });

  it('does not fire onComplete for a quest added already complete', () => {
    const actions = run(rootState([]), rootState([quest('complete', never)]));
    expect(actions).toEqual([]);
  });

  it('completes a scene objective when a choice is taken in that scene', () => {
    const actions = run(
      rootState([quest('available', cafe)], {
        activeViewId: 'SceneView',
        props: { scene: cafe },
      }),
      rootState([quest('available', cafe)]),
    );
    expect(actions).toEqual([completeO1, firedOnComplete]);
  });

  it('matches the scene by content after a save is reloaded', () => {
    const reloaded = JSON.parse(JSON.stringify(cafe)) as Scene;
    const actions = run(
      rootState([quest('available', cafe)], {
        activeViewId: 'SceneView',
        props: { scene: reloaded },
      }),
      rootState([quest('available', cafe)]),
    );
    expect(actions).toEqual([completeO1, firedOnComplete]);
  });

  it('leaves a scene objective alone while a different scene is shown', () => {
    const actions = run(
      rootState([quest('available', cafe)], {
        activeViewId: 'SceneView',
        props: { scene: park },
      }),
      rootState([quest('available', cafe)]),
    );
    expect(actions).toEqual([]);
  });

  it('leaves a locked scene objective alone', () => {
    const actions = run(
      rootState([quest('locked', cafe)], {
        activeViewId: 'SceneView',
        props: { scene: cafe },
      }),
      rootState([quest('locked', cafe)]),
    );
    expect(actions).not.toContainEqual(completeO1);
    expect(actions).not.toContainEqual(firedOnComplete);
  });
});

describe('quests post-effect: action triggers', () => {
  const availableO1 = updateQuestObjective({
    questId: 'q',
    objectiveName: 'o1',
    objectiveState: 'available',
  });

  function triggered(state: ObjectiveState, condition?: Condition): Quest {
    return {
      id: 'q',
      name: 'Quest',
      objectives: [
        {
          name: 'o1',
          state,
          trigger: { kind: 'action', text: 'Ask', condition, effects: [] },
          condition: never,
        },
      ],
    };
  }

  it("unlocks an action-triggered objective once the action's condition holds", () => {
    const actions = run(
      rootState([triggered('locked', always)]),
      rootState([triggered('locked', always)]),
    );
    expect(actions).toEqual([availableO1]);
  });

  it('unlocks an action-triggered objective whose action has no condition', () => {
    const actions = run(
      rootState([triggered('locked')]),
      rootState([triggered('locked')]),
    );
    expect(actions).toEqual([availableO1]);
  });

  it("keeps an action-triggered objective locked while the action's condition fails", () => {
    const actions = run(
      rootState([triggered('locked', never)]),
      rootState([triggered('locked', never)]),
    );
    expect(actions).toEqual([]);
  });
});

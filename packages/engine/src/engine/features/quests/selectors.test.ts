import { describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Effect } from '@chemicalluck/sim-engine/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import {
  questActions,
  selectActiveQuests,
  selectCompletedQuests,
  selectQuests,
} from './selectors';
import type { Quest, QuestObjective } from './types';

function makeState(quests: Quest[]): RootState {
  return {
    present: { quests },
  } as unknown as RootState;
}

const active: Quest = {
  id: 'a',
  name: 'Active',
  objectives: [
    { name: 'o1', state: 'available', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

const complete: Quest = {
  id: 'b',
  name: 'Done',
  objectives: [
    { name: 'o1', state: 'complete', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

const mixed: Quest = {
  id: 'c',
  name: 'Mixed',
  objectives: [
    { name: 'o1', state: 'complete', condition: { kind: 'action' } },
    { name: 'o2', state: 'available', condition: { kind: 'action' } },
  ],
} as unknown as Quest;

describe('quests selectors', () => {
  it('selectQuests returns the quests slice', () => {
    const state = makeState([active]);
    expect(selectQuests(state)).toEqual([active]);
  });

  it('selectActiveQuests returns quests with any available objective', () => {
    const state = makeState([active, complete, mixed]);
    const result = selectActiveQuests(state);
    expect(result.map((q) => q.id)).toEqual(['a', 'c']);
  });

  it('selectCompletedQuests returns quests whose objectives are all complete', () => {
    const state = makeState([active, complete, mixed]);
    const result = selectCompletedQuests(state);
    expect(result.map((q) => q.id)).toEqual(['b']);
  });

  it('never lists a quest as both active and completed', () => {
    const state = makeState([active, complete, mixed]);
    const activeIds = selectActiveQuests(state).map((q) => q.id);
    const completedIds = selectCompletedQuests(state).map((q) => q.id);
    expect(activeIds.filter((id) => completedIds.includes(id))).toEqual([]);
  });
});

describe('questActions', () => {
  const ownEffect: Effect = { kind: 'money', amount: 5 };
  const completeEffect: Effect = {
    kind: 'quest',
    questId: 'q',
    objectiveName: 'o1',
    objectiveState: 'complete',
  };

  function questWith(objective: Partial<QuestObjective>): Quest {
    return {
      id: 'q',
      name: 'Quest',
      objectives: [
        {
          name: 'o1',
          state: 'available',
          condition: { kind: 'action', text: 'Unused', effects: [] },
          ...objective,
        },
      ],
    };
  }

  it('completes an action objective even when the action has its own effects', () => {
    const quest = questWith({
      condition: { kind: 'action', text: 'Pay', effects: [ownEffect] },
    });
    const [group] = questActions(makeState([quest]));
    expect(group.actions).toHaveLength(1);
    expect(group.actions[0].text).toBe('Pay');
    expect(group.actions[0].effects).toEqual([ownEffect, completeEffect]);
  });

  it('completes an action-triggered objective even when the action has its own effects', () => {
    const quest = questWith({
      trigger: { kind: 'action', text: 'Ask', effects: [ownEffect] },
      condition: { kind: 'const', value: 0 } as unknown as Condition,
    });
    const [group] = questActions(makeState([quest]));
    expect(group.actions[0].text).toBe('Ask');
    expect(group.actions[0].effects).toEqual([ownEffect, completeEffect]);
  });

  it('completes an action objective whose action has no effects', () => {
    const quest = questWith({
      condition: { kind: 'action', text: 'Wave' },
    });
    const [group] = questActions(makeState([quest]));
    expect(group.actions[0].effects).toEqual([completeEffect]);
  });

  it('hides an action trigger while its objective is locked', () => {
    const quest = questWith({
      state: 'locked',
      trigger: { kind: 'action', text: 'Ask', effects: [ownEffect] },
      condition: { kind: 'const', value: 0 } as unknown as Condition,
    });
    expect(questActions(makeState([quest]))).toEqual([]);
  });
});

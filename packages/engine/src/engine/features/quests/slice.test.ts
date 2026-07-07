import { describe, expect, it } from 'vitest';

import reducer, { addQuest, loadQuests, updateQuestObjective } from './slice';
import type { Quest } from './types';

const welcome: Quest = {
  id: 'welcome',
  name: 'Welcome Week',
  objectives: [
    {
      name: 'visit_quad',
      state: 'available',
      condition: {
        kind: 'and',
        lhs: {
          kind: 'gt',
          lhs: { kind: 'const', value: 0 },
          rhs: { kind: 'const', value: 0 },
        },
        rhs: {
          kind: 'gt',
          lhs: { kind: 'const', value: 0 },
          rhs: { kind: 'const', value: 0 },
        },
      },
    },
  ],
} as unknown as Quest;

describe('quests slice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([]);
  });

  it('loadQuests replaces the entire quest list', () => {
    const next = reducer([], loadQuests([welcome]));
    expect(next).toEqual([welcome]);
  });

  it('addQuest appends a quest', () => {
    const next = reducer([], addQuest(welcome));
    expect(next).toEqual([welcome]);
  });

  it('updateQuestObjective changes the objective state', () => {
    const next = reducer(
      [welcome],
      updateQuestObjective({
        questId: 'welcome',
        objectiveName: 'visit_quad',
        objectiveState: 'complete',
      }),
    );
    expect(next[0].objectives[0].state).toBe('complete');
  });

  it('updateQuestObjective is a no-op for unknown quests', () => {
    const next = reducer(
      [welcome],
      updateQuestObjective({
        questId: 'unknown',
        objectiveName: 'visit_quad',
        objectiveState: 'complete',
      }),
    );
    expect(next).toEqual([welcome]);
  });

  it('updateQuestObjective is a no-op for unknown objectives', () => {
    const next = reducer(
      [welcome],
      updateQuestObjective({
        questId: 'welcome',
        objectiveName: 'unknown',
        objectiveState: 'complete',
      }),
    );
    expect(next).toEqual([welcome]);
  });
});

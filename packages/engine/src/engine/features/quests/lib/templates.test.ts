import { describe, expect, it } from 'vitest';

import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';

import type { QuestTemplate } from '../types';
import { instantiateQuestTemplate } from './templates';

const npc = {
  id: 'ann_lee',
  profile: {
    firstName: 'Ann',
    lastName: 'Lee',
    profession: 'Baker',
    age: 30,
    appearance: {},
  },
  pronouns: {},
} as unknown as NPC;

describe('instantiateQuestTemplate', () => {
  it('fills {npc0.id} with the NPC id', () => {
    const template: QuestTemplate = {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet {npc0.firstName} ({npc0.id})',
      objectives: [
        {
          name: 'talk_{npc0.id}',
          state: 'available',
          condition: { kind: 'milestone', milestoneId: 'met' },
          onComplete: [
            {
              kind: 'quest',
              questId: 'meet_{npc0.id}',
              objectiveName: 'talk_{npc0.id}',
              objectiveState: 'complete',
            },
          ],
        },
      ],
    };

    const quest = instantiateQuestTemplate(template, npc);

    expect(quest.id).toBe('meet_ann_lee');
    expect(quest.name).toBe('Meet Ann (ann_lee)');
    expect(quest.objectives[0].name).toBe('talk_ann_lee');
    expect(quest.objectives[0].onComplete).toEqual([
      {
        kind: 'quest',
        questId: 'meet_ann_lee',
        objectiveName: 'talk_ann_lee',
        objectiveState: 'complete',
      },
    ]);
  });
});

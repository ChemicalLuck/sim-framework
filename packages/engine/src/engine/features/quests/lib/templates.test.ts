import { describe, expect, it } from 'vitest';

import type { NPC } from '@chemicalluck/sim-engine/features/npcs/types';
import type { Scene } from '@chemicalluck/sim-engine/types/scene.types';

import type { QuestTemplate } from '../types';
import { hasNpcToken, instantiateQuestTemplate } from './templates';

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

  it('fills placeholders in an action trigger and an action objective', () => {
    const scene: Scene = { kind: 'scene', text: 'A room.', actions: [] };
    const view = {
      kind: 'view',
      activeViewId: 'SceneView',
      props: { scene },
    } as const;
    const template: QuestTemplate = {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet',
      objectives: [
        {
          name: 'talk',
          state: 'locked',
          trigger: {
            kind: 'action',
            text: 'Wave at {npc0.firstName}',
            condition: { kind: 'milestone', milestoneId: 'saw_{npc0.id}' },
            effects: [
              { kind: 'milestone', milestoneId: 'waved_{npc0.id}' },
              view,
            ],
          },
          condition: {
            kind: 'action',
            text: 'Talk to {npc0.firstName} {npc0.lastName}',
            lockedText: '{npc0.firstName} is busy',
            effects: [{ kind: 'milestone', milestoneId: 'talked_{npc0.id}' }],
          },
        },
      ],
    };

    const [objective] = instantiateQuestTemplate(template, npc).objectives;

    expect(objective.trigger).toEqual({
      kind: 'action',
      text: 'Wave at Ann',
      condition: { kind: 'milestone', milestoneId: 'saw_ann_lee' },
      effects: [{ kind: 'milestone', milestoneId: 'waved_ann_lee' }, view],
    });
    expect(objective.condition).toEqual({
      kind: 'action',
      text: 'Talk to Ann Lee',
      lockedText: 'Ann is busy',
      effects: [{ kind: 'milestone', milestoneId: 'talked_ann_lee' }],
    });
    // The scene a view effect shows is shared content: kept, not copied.
    const [, shown] = (objective.trigger as { effects: (typeof view)[] })
      .effects;
    expect(shown.props.scene).toBe(scene);
  });

  it('fills placeholders in a condition trigger and a condition objective', () => {
    const template: QuestTemplate = {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet',
      objectives: [
        {
          name: 'talk',
          state: 'locked',
          trigger: { kind: 'milestone', milestoneId: 'saw_{npc0.id}' },
          condition: {
            kind: 'and',
            lhs: { kind: 'milestone', milestoneId: 'talked_{npc0.id}' },
            rhs: {
              kind: 'not',
              operand: { kind: 'milestone', milestoneId: 'fought_{npc0.id}' },
            },
          },
        },
      ],
    };

    const [objective] = instantiateQuestTemplate(template, npc).objectives;

    expect(objective.trigger).toEqual({
      kind: 'milestone',
      milestoneId: 'saw_ann_lee',
    });
    expect(objective.condition).toEqual({
      kind: 'and',
      lhs: { kind: 'milestone', milestoneId: 'talked_ann_lee' },
      rhs: {
        kind: 'not',
        operand: { kind: 'milestone', milestoneId: 'fought_ann_lee' },
      },
    });
  });

  it('keeps a scene objective as the hydrated scene, without copying it', () => {
    const scene: Scene = {
      kind: 'scene',
      text: 'Meet {npc0.firstName}.',
      actions: [],
    };
    const before = structuredClone(scene);
    const template: QuestTemplate = {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet',
      objectives: [{ name: 'talk', state: 'available', condition: scene }],
    };

    const [objective] = instantiateQuestTemplate(template, npc).objectives;

    expect(objective.condition).toBe(scene);
    expect(scene).toEqual(before);
  });

  it('does not change the template', () => {
    const template: QuestTemplate = {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet',
      objectives: [
        {
          name: 'talk',
          state: 'locked',
          trigger: { kind: 'milestone', milestoneId: 'saw_{npc0.id}' },
          condition: { kind: 'action', text: 'Hi {npc0.firstName}' },
        },
      ],
    };
    const before = structuredClone(template);

    instantiateQuestTemplate(template, npc);

    expect(template).toEqual(before);
  });
});

describe('hasNpcToken', () => {
  it('finds the {npc0…} tokens a template is rendered with', () => {
    expect(hasNpcToken('meet_{npc0.id}')).toBe(true);
    expect(hasNpcToken('meet_{npc0.firstName}_{npc0.lastName}')).toBe(true);
  });

  it('finds no token in a fixed id or other braces', () => {
    expect(hasNpcToken('meet')).toBe(false);
    expect(hasNpcToken('meet_{weather}')).toBe(false);
    expect(hasNpcToken('meet_{npc0.id')).toBe(false);
  });
});

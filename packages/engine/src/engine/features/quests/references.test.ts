import { describe, expect, it } from 'vitest';

import {
  idSources as coreIdSources,
  referenceProviders as coreProviders,
} from '@chemicalluck/sim-engine/features/core/references';
import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';
import type { JsonSceneWithId } from '@chemicalluck/sim-engine/features/core/types';
import {
  nodeRefExtractors as milestoneExtractors,
  idSources as milestoneIdSources,
  nodeRefRewriters as milestoneRewriters,
} from '@chemicalluck/sim-engine/features/milestones/references';
import {
  makeExtract,
  makeRewrite,
  rewriteReferences,
  validateReferences,
} from '@chemicalluck/sim-engine/lib/validation';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import type { JsonQuest, JsonQuestTemplate } from './authoring.types';
import {
  idSources,
  nodeRefExtractors,
  nodeRefRewriters,
  referenceProviders,
  referenceRewriters,
} from './references';

const quests: JsonQuest[] = [
  {
    id: 'q',
    name: 'Quest',
    objectives: [
      {
        name: 'visit',
        state: 'available',
        condition: { kind: 'scene', sceneId: 'cafe' },
      },
    ],
  },
];

describe('quests references', () => {
  it('records the scene a scene objective names', () => {
    const [provider] = referenceProviders;
    expect(provider.collect(quests, () => [])).toContainEqual({
      namespace: 'scene',
      id: 'cafe',
      source: 'quest:q',
      section: 'quests',
    });
  });

  it('rewrites the scene id when the scene is renamed', () => {
    const data = structuredClone(quests);
    const [rewriter] = referenceRewriters;
    expect(rewriter.rewrite(data, () => false, 'scene', 'cafe', 'diner')).toBe(
      1,
    );
    expect(data[0].objectives[0].condition).toEqual({
      kind: 'scene',
      sceneId: 'diner',
    });
  });
});

describe('quests references in objective actions, scenes and onComplete', () => {
  const milestone = (id: string): Condition => ({
    kind: 'milestone',
    milestoneId: id,
  });
  const startQuest = (id: string): JsonEffect => ({
    kind: 'quest',
    questId: id,
    objectiveName: '',
    objectiveState: 'available',
  });

  const data = (): JsonQuest[] => [
    {
      id: 'q',
      name: 'Quest',
      objectives: [
        {
          name: 'talk',
          state: 'locked',
          trigger: {
            kind: 'action',
            text: 'Ask',
            condition: milestone('met'),
            effects: [startQuest('asked')],
          },
          condition: {
            kind: 'action',
            text: 'Go',
            condition: milestone('ready'),
            effects: [startQuest('went')],
          },
          onComplete: [startQuest('done')],
        },
        {
          name: 'inline',
          state: 'available',
          condition: {
            kind: 'scene',
            text: 'A room.',
            actions: [
              {
                actions: [
                  {
                    kind: 'action',
                    text: 'Look',
                    condition: milestone('lit'),
                    effects: [startQuest('looked')],
                  },
                ],
              },
            ],
            completionEffects: [startQuest('left')],
          },
        },
        {
          name: 'cond',
          state: 'locked',
          trigger: milestone('started'),
          condition: milestone('finished'),
        },
      ],
    },
  ];

  const extract = makeExtract([...nodeRefExtractors, ...milestoneExtractors]);
  const rewrite = makeRewrite([...nodeRefRewriters, ...milestoneRewriters]);
  const ref = (namespace: string, id: string) => ({
    namespace,
    id,
    source: 'quest:q',
    section: 'quests',
  });

  it('collects references from every part of an objective', () => {
    const refs = referenceProviders[0].collect(data(), extract);
    for (const id of ['asked', 'went', 'done', 'looked', 'left']) {
      expect(refs).toContainEqual(ref('quest', id));
    }
    for (const id of ['met', 'ready', 'lit', 'started', 'finished']) {
      expect(refs).toContainEqual(ref('milestone', id));
    }
  });

  it('rewrites quest ids in objective action, scene and onComplete effects', () => {
    const quests = data();
    const count = referenceRewriters[0].rewrite(
      quests,
      (node) => rewrite(node, 'quest', 'done', 'finale'),
      'quest',
      'done',
      'finale',
    );
    expect(count).toBe(1);
    expect(quests[0].objectives[0].onComplete).toEqual([startQuest('finale')]);

    for (const id of ['asked', 'went', 'looked', 'left']) {
      const renamed = data();
      expect(
        referenceRewriters[0].rewrite(
          renamed,
          (node) => rewrite(node, 'quest', id, 'renamed'),
          'quest',
          id,
          'renamed',
        ),
      ).toBe(1);
      expect(JSON.stringify(renamed)).not.toContain(`"${id}"`);
    }
  });

  it('rewrites milestone ids in objective action conditions', () => {
    for (const id of ['met', 'ready', 'lit', 'started', 'finished']) {
      const quests = data();
      expect(
        referenceRewriters[0].rewrite(
          quests,
          (node) => rewrite(node, 'milestone', id, 'renamed'),
          'milestone',
          id,
          'renamed',
        ),
      ).toBe(1);
      expect(JSON.stringify(quests)).not.toContain(`"${id}"`);
    }
  });
});

describe('validating a game without quests.json', () => {
  const contributions = {
    idSources: [...coreIdSources, ...idSources],
    referenceProviders: [...coreProviders, ...referenceProviders],
    nodeRefExtractors,
    nodeRefRewriters: [],
    referenceRewriters: [],
  };
  const scenes: JsonSceneWithId[] = [
    {
      id: 'cafe',
      kind: 'scene',
      text: 'The café.',
      actions: [
        {
          actions: [
            {
              kind: 'action',
              text: 'Order',
              effects: [
                {
                  kind: 'quest',
                  questId: 'coffee',
                  objectiveName: 'order',
                  objectiveState: 'complete',
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  it('reports no issues when quests.json is absent', () => {
    expect(validateReferences({ scenes }, contributions)).toEqual([]);
  });

  it('still checks quest references once quests.json exists', () => {
    expect(
      validateReferences({ scenes, quests: [] }, contributions),
    ).toContainEqual({
      section: 'scenes',
      source: 'scene:cafe',
      message: "references unknown quest 'coffee'",
    });
  });
});

describe('quest-templates references', () => {
  const templates = (): JsonQuestTemplate[] => [
    {
      id: 'meet',
      idTemplate: 'meet_{npc0.id}',
      name: 'Meet {npc0.firstName}',
      objectives: [
        {
          name: 'talk',
          state: 'available',
          trigger: { kind: 'milestone', milestoneId: 'met' },
          condition: { kind: 'scene', sceneId: 'cafe' },
          onComplete: [
            {
              kind: 'quest',
              questId: 'meet_{npc0.id}',
              objectiveName: 'talk',
              objectiveState: 'complete',
            },
            {
              kind: 'quest',
              questId: 'missing',
              objectiveName: '',
              objectiveState: 'available',
            },
            {
              kind: 'quest_create',
              templateId: 'follow_{npc0.id}',
              npcId: '{npc0.id}',
            },
          ],
        },
      ],
    },
  ];
  const contributions = {
    idSources: [...coreIdSources, ...milestoneIdSources, ...idSources],
    referenceProviders: [...coreProviders, ...referenceProviders],
    nodeRefExtractors: [...nodeRefExtractors, ...milestoneExtractors],
    nodeRefRewriters: [...nodeRefRewriters, ...milestoneRewriters],
    referenceRewriters,
  };
  const content = () => ({
    scenes: [{ id: 'cafe', kind: 'scene', text: 'The café.', actions: [] }],
    quests: [],
    'quest-templates': templates(),
    milestones: [{ id: 'met' }],
  });
  const unknownQuest = {
    section: 'quest-templates',
    source: 'questTemplate:meet',
    message: "references unknown quest 'missing'",
  };

  it('flags a real unknown id in a template', () => {
    expect(validateReferences(content(), contributions)).toContainEqual(
      unknownQuest,
    );
  });

  it('skips references whose id holds a placeholder', () => {
    expect(validateReferences(content(), contributions)).toEqual([
      unknownQuest,
    ]);
  });

  it('rewrites template references when an id is renamed', () => {
    const renamed = (ns: string, oldId: string, newId: string) => {
      const { changed, count } = rewriteReferences(
        content(),
        contributions,
        ns,
        oldId,
        newId,
      );
      expect(count).toBe(1);
      return (changed['quest-templates'] as JsonQuestTemplate[])[0]
        .objectives[0];
    };

    expect(renamed('scene', 'cafe', 'diner').condition).toEqual({
      kind: 'scene',
      sceneId: 'diner',
    });
    expect(renamed('quest', 'missing', 'found').onComplete?.[1]).toMatchObject({
      kind: 'quest',
      questId: 'found',
    });
    expect(renamed('milestone', 'met', 'introduced').trigger).toEqual({
      kind: 'milestone',
      milestoneId: 'introduced',
    });
  });
});

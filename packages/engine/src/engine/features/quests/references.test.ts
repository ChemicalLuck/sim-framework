import { describe, expect, it } from 'vitest';

import type { JsonQuest } from './authoring.types';
import { referenceProviders, referenceRewriters } from './references';

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

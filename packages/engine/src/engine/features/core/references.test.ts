import { describe, expect, it } from 'vitest';

import {
  nodeRefExtractors,
  nodeRefRewriters,
} from '@chemicalluck/sim-engine/features/quests/references';
import {
  makeExtract,
  makeRewrite,
} from '@chemicalluck/sim-engine/lib/validation';

import { referenceProviders, referenceRewriters } from './references';
import type { JsonEffect, JsonScript } from './types';

const startQuest = (id: string): JsonEffect => ({
  kind: 'quest',
  questId: id,
  objectiveName: '',
  objectiveState: 'available',
});

const scripts = (): JsonScript[] => [
  {
    id: 'date',
    order: 'sequential',
    duration: 60,
    scenes: [
      {
        kind: 'scene',
        text: 'Dinner.',
        actions: [],
        completionEffects: [startQuest('dessert')],
      },
    ],
  },
];

const scriptsProvider = referenceProviders.find((p) => p.file === 'scripts');
const scriptsRewriter = referenceRewriters.find((r) => r.file === 'scripts');
const extract = makeExtract(nodeRefExtractors);
const rewrite = makeRewrite(nodeRefRewriters);

describe('core references', () => {
  it("collects references from a script scene's completionEffects", () => {
    expect(scriptsProvider?.collect(scripts(), extract)).toContainEqual({
      namespace: 'quest',
      id: 'dessert',
      source: 'script:date',
      section: 'scripts',
    });
  });

  it("rewrites references in a script scene's completionEffects", () => {
    const data = scripts();
    const count = scriptsRewriter?.rewrite(
      data,
      (node) => rewrite(node, 'quest', 'dessert', 'coffee'),
      'quest',
      'dessert',
      'coffee',
    );
    expect(count).toBe(1);
    expect(data[0].scenes[0].completionEffects).toEqual([startQuest('coffee')]);
  });
});

import { describe, expect, it } from 'vitest';

import {
  nodeRefExtractors as milestoneExtractors,
  nodeRefRewriters as milestoneRewriters,
} from '@chemicalluck/sim-engine/features/milestones/references';
import {
  makeExtract,
  makeRewrite,
} from '@chemicalluck/sim-engine/lib/validation';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import type { JsonShop } from './authoring.types';
import { referenceProviders, referenceRewriters } from './references';

const milestone = (id: string): Condition => ({
  kind: 'milestone',
  milestoneId: id,
});

const shops = (): JsonShop[] => [
  {
    id: 'market',
    text: '',
    tabs: [
      {
        title: 'VIP',
        condition: milestone('vip'),
        items: [
          { kind: 'item', itemId: 'apple', condition: milestone('member') },
        ],
      },
    ],
  },
];

const extract = makeExtract(milestoneExtractors);
const rewrite = makeRewrite(milestoneRewriters);
const ref = (namespace: string, id: string) => ({
  namespace,
  id,
  source: 'shop:market',
  section: 'shops',
});

describe('shop references', () => {
  it('collects references from entry and tab conditions', () => {
    const refs = referenceProviders[0].collect(shops(), extract);
    expect(refs).toContainEqual(ref('item', 'apple'));
    expect(refs).toContainEqual(ref('milestone', 'vip'));
    expect(refs).toContainEqual(ref('milestone', 'member'));
  });

  it('rewrites references inside entry and tab conditions', () => {
    const data = shops();
    const count = referenceRewriters[0].rewrite(
      data,
      (node) => rewrite(node, 'milestone', 'member', 'gold'),
      'milestone',
      'member',
      'gold',
    );
    expect(count).toBe(1);
    expect(data[0].tabs[0].items[0].condition).toEqual(milestone('gold'));
  });
});

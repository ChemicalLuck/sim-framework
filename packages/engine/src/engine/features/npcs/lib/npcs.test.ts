import { beforeEach, describe, expect, it } from 'vitest';
import { Mulberry32 } from '@sim/engine/features/rng/lib/rng';
import type { BodyAttributes } from '@sim/engine/types';

import type { NPC } from '../types';
import {
  type AppearanceJsonData,
  configureAppearance,
} from './appearance-config';
import { createNpc, initNpcNames } from './npcs';
import { configureProfessions } from './professions';

function requireBody(npc: NPC): BodyAttributes {
  if (!npc.body) throw new Error('npc.body was not populated');
  return npc.body;
}

const APPEARANCE: AppearanceJsonData = {
  features: [
    {
      id: 'gender',
      label: 'Gender',
      values: ['Male', 'Female'],
      isDimension: true,
      weights: { default: { Male: 1, Female: 1 } },
      pronouns: {
        Male: {
          subject: 'he',
          object: 'him',
          possessive: 'his',
          reflexive: 'himself',
          noun: 'man',
        },
        Female: {
          subject: 'she',
          object: 'her',
          possessive: 'her',
          reflexive: 'herself',
          noun: 'woman',
        },
      },
    },
  ],
  ageDistribution: { min: 18, max: 80, mean: 30, stdDev: 10 },
  bodyAttributes: [
    {
      id: 'height',
      label: 'Height',
      unit: 'cm',
      default: 170,
      distribution: {
        default: { min: 120, max: 220, mean: 170, stdDev: 8 },
        byDimension: {
          gender: {
            Male: { mean: 200, stdDev: 1 },
            Female: { mean: 160, stdDev: 1 },
          },
        },
      },
    },
    {
      id: 'weight',
      label: 'Weight',
      unit: 'kg',
      default: 70,
      distribution: { default: { min: 30, max: 200, mean: 70, stdDev: 14 } },
    },
    {
      id: 'bodyFat',
      label: 'Body Fat',
      unit: '%',
      default: 20,
      distribution: { default: { min: 3, max: 60, mean: 20, stdDev: 7 } },
    },
    {
      id: 'bustDifference',
      label: 'Bust − Underbust',
      unit: 'in',
      default: 2,
      showWhen: { featureId: 'gender', values: ['Female'] },
      distribution: { default: { min: 1, max: 20, mean: 4, stdDev: 2 } },
    },
  ],
  display: { strangerFeatureIds: [], metaFeatureIds: [] },
};

beforeEach(() => {
  configureAppearance(APPEARANCE);
  initNpcNames({ male: ['Bob'], female: ['Alice'], surnames: ['Smith'] });
  configureProfessions({ professions: ['Student'] });
});

describe('NpcFactory body sampling', () => {
  it('attaches a body with every configured attribute within bounds', () => {
    const body = requireBody(createNpc(new Mulberry32(1)));
    expect(body.height).toBeGreaterThanOrEqual(120);
    expect(body.height).toBeLessThanOrEqual(220);
    expect(body.weight).toBeGreaterThanOrEqual(30);
    expect(body.weight).toBeLessThanOrEqual(200);
    expect(body.bodyFat).toBeGreaterThanOrEqual(3);
    expect(body.bodyFat).toBeLessThanOrEqual(60);
  });

  it('seeds the body deterministically', () => {
    const a = createNpc(new Mulberry32(42));
    const b = createNpc(new Mulberry32(42));
    expect(a.body).toEqual(b.body);
  });

  it('uses the dimension override distribution', () => {
    const heights: { male: number[]; female: number[] } = {
      male: [],
      female: [],
    };
    for (let i = 0; i < 50; i++) {
      const npc = createNpc(new Mulberry32(i * 13 + 7));
      const bucket = npc.pronouns.noun === 'man' ? 'male' : 'female';
      heights[bucket].push(requireBody(npc).height);
    }
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(avg(heights.male)).toBeGreaterThan(avg(heights.female));
    // Male mean ~200, Female mean ~160 with tight stdDev=1.
    expect(avg(heights.male)).toBeGreaterThan(195);
    expect(avg(heights.female)).toBeLessThan(165);
  });

  it('only samples bustDifference for woman pronouns', () => {
    let menWithBust = 0;
    let womenWithBust = 0;
    let women = 0;
    for (let i = 0; i < 50; i++) {
      const npc = createNpc(new Mulberry32(i * 31 + 1));
      const body = requireBody(npc);
      if (npc.pronouns.noun === 'man') {
        if (body.bustDifference !== 0) menWithBust++;
      } else if (npc.pronouns.noun === 'woman') {
        women++;
        if (body.bustDifference > 0) womenWithBust++;
      }
    }
    expect(menWithBust).toBe(0);
    // Female bustDifference distribution has min=1, so every woman gets > 0.
    expect(womenWithBust).toBe(women);
    expect(women).toBeGreaterThan(0);
  });
});

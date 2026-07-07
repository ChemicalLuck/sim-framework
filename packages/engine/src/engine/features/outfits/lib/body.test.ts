import { describe, expect, it } from 'vitest';
import type { BodyAttributes } from '@sim/engine/types/character.types';

import { estimateMetric, resolveMetric } from './body';
import type { EstimatedMetric } from './wearable-config';

const METRICS: Record<string, EstimatedMetric> = {
  waist: {
    default: { intercept: 40, terms: { weight: 0.5, bodyFat: 0.3 } },
    byGender: {
      Male: { intercept: 44, terms: { weight: 0.6, bodyFat: 0.3 } },
    },
  },
  inseam: {
    default: { intercept: 0, terms: { height: 0.45 } },
  },
};

const body = (over: Partial<BodyAttributes> = {}): BodyAttributes => ({
  height: 170,
  weight: 70,
  bodyFat: 20,
  bustDifference: 4,
  ...over,
});

describe('estimateMetric', () => {
  it('evaluates the default linear model', () => {
    // 40 + 0.5*70 + 0.3*20 = 81
    expect(estimateMetric('waist', body(), undefined, METRICS)).toBe(81);
  });

  it('selects the gender-specific model when present', () => {
    // 44 + 0.6*70 + 0.3*20 = 92
    expect(estimateMetric('waist', body(), 'Male', METRICS)).toBe(92);
  });

  it('falls back to default for an unknown gender', () => {
    expect(estimateMetric('waist', body(), 'Other', METRICS)).toBe(81);
  });

  it('returns undefined for an unmodelled metric', () => {
    expect(estimateMetric('nope', body(), undefined, METRICS)).toBeUndefined();
  });

  it('rises monotonically with weight (waist) and height (inseam)', () => {
    const light =
      estimateMetric('waist', body({ weight: 60 }), undefined, METRICS) ?? 0;
    const heavy =
      estimateMetric('waist', body({ weight: 90 }), undefined, METRICS) ?? 0;
    expect(heavy).toBeGreaterThan(light);

    const short =
      estimateMetric('inseam', body({ height: 160 }), undefined, METRICS) ?? 0;
    const tall =
      estimateMetric('inseam', body({ height: 190 }), undefined, METRICS) ?? 0;
    expect(tall).toBeGreaterThan(short);
  });
});

describe('resolveMetric', () => {
  it('returns a primary attribute directly', () => {
    expect(resolveMetric('height', body(), undefined, METRICS)).toBe(170);
  });

  it('estimates a non-primary metric', () => {
    expect(resolveMetric('waist', body(), undefined, METRICS)).toBe(81);
  });
});

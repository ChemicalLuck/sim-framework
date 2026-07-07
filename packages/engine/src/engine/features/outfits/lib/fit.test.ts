import { describe, expect, it } from 'vitest';
import type { BodyAttributes } from '@chemicalluck/sim-engine/types/character.types';
import type { Wearable } from '@chemicalluck/sim-engine/types/item.types';

import {
  estimatePlayerSizes,
  evaluateFit,
  formatSize,
  idealSizeIndex,
  idealSizeLabels,
  parseSizeLabel,
} from './fit';
import type { EstimatedMetric, SizeSystem } from './wearable-config';

const sizeSystems: Record<string, SizeSystem> = {
  'alpha-tops': {
    labelFormat: '{size}',
    dimensions: [
      {
        name: 'size',
        metric: 'chest',
        sizes: [
          { label: 'S', max: 96 },
          { label: 'M', max: 104 },
          { label: 'L', max: 112 },
        ],
      },
    ],
  },
  trousers: {
    labelFormat: '{waist}/{length}',
    dimensions: [
      {
        name: 'waist',
        metric: 'waist',
        sizes: [
          { label: '30', max: 78 },
          { label: '32', max: 83 },
          { label: '34', max: 88 },
        ],
      },
      {
        name: 'length',
        metric: 'inseam',
        sizes: [
          { label: '30', max: 77 },
          { label: '32', max: 82 },
        ],
      },
    ],
  },
  bra: {
    labelFormat: '{band}{cup}',
    dimensions: [
      {
        name: 'band',
        metric: 'underbust',
        sizes: [
          { label: '32', max: 75 },
          { label: '34', max: 80 },
          { label: '36', max: 85 },
        ],
      },
      {
        name: 'cup',
        metric: 'bustDifference',
        sizes: [
          { label: 'A', max: 13 },
          { label: 'B', max: 15 },
          { label: 'C', max: 17 },
        ],
      },
    ],
  },
};

const estimatedMetrics: Record<string, EstimatedMetric> = {
  chest: { default: { intercept: 0, terms: {} } },
  waist: { default: { intercept: 0, terms: {} } },
  inseam: { default: { intercept: 0, terms: {} } },
  underbust: { default: { intercept: 0, terms: {} } },
  bustDifference: { default: { intercept: 0, terms: {} } },
};

const config = { sizeSystems, estimatedMetrics };

// Force exact estimated measurements by storing them as primary attributes,
// which resolveMetric returns directly.
const body = (over: Record<string, number>): BodyAttributes =>
  ({ height: 170, weight: 70, bodyFat: 20, ...over }) as BodyAttributes;

const wearable = (sizeSystem: string, size: string): Wearable => ({
  kind: 'wearable',
  id: 'w',
  name: 'w',
  slot: 'baselayer',
  appearance: {},
  sizeSystem,
  size,
});

describe('idealSizeIndex', () => {
  const dim = sizeSystems['alpha-tops'].dimensions[0];
  it('picks the first tier covering the value', () => {
    expect(idealSizeIndex(90, dim)).toBe(0); // S
    expect(idealSizeIndex(96, dim)).toBe(0); // boundary inclusive
    expect(idealSizeIndex(100, dim)).toBe(1); // M
  });
  it('clamps to the largest tier when over the top', () => {
    expect(idealSizeIndex(999, dim)).toBe(2); // L
  });
});

describe('parseSizeLabel / formatSize round-trip', () => {
  it('single dimension', () => {
    const parsed = parseSizeLabel('M', sizeSystems['alpha-tops']);
    expect(parsed).toEqual({ size: 'M' });
    expect(formatSize(sizeSystems['alpha-tops'], parsed)).toBe('M');
  });
  it('separated compound (trousers)', () => {
    const parsed = parseSizeLabel('32/30', sizeSystems.trousers);
    expect(parsed).toEqual({ waist: '32', length: '30' });
    expect(formatSize(sizeSystems.trousers, parsed)).toBe('32/30');
  });
  it('unseparated compound (bra)', () => {
    const parsed = parseSizeLabel('34B', sizeSystems.bra);
    expect(parsed).toEqual({ band: '34', cup: 'B' });
    expect(formatSize(sizeSystems.bra, parsed)).toBe('34B');
  });
  it('returns empty for an unparseable label', () => {
    expect(parseSizeLabel('99Z', sizeSystems.bra)).toEqual({});
  });
});

describe('evaluateFit', () => {
  it('reports sizeless when no size system', () => {
    const w = { ...wearable('alpha-tops', 'M'), sizeSystem: undefined };
    expect(evaluateFit(w, body({}), undefined, config).sizeless).toBe(true);
  });

  it('reports a perfect fit', () => {
    // chest 100 -> ideal M; chosen M
    const fit = evaluateFit(
      wearable('alpha-tops', 'M'),
      body({ chest: 100 }),
      undefined,
      config,
    );
    expect(fit.totalMismatch).toBe(0);
    expect(fit.descriptor).toBe('fits');
  });

  it('detects too tight (negative mismatch)', () => {
    // chest 100 -> ideal M (idx 1); chosen S (idx 0) => -1
    const fit = evaluateFit(
      wearable('alpha-tops', 'S'),
      body({ chest: 100 }),
      undefined,
      config,
    );
    expect(fit.perDimension[0].mismatch).toBe(-1);
    expect(fit.descriptor).toContain('tight');
  });

  it('detects too loose (positive mismatch)', () => {
    // chest 90 -> ideal S (idx 0); chosen L (idx 2) => +2
    const fit = evaluateFit(
      wearable('alpha-tops', 'L'),
      body({ chest: 90 }),
      undefined,
      config,
    );
    expect(fit.perDimension[0].mismatch).toBe(2);
    expect(fit.totalMismatch).toBe(2);
    expect(fit.descriptor).toContain('loose');
  });

  it('sums mismatch across both bra dimensions', () => {
    // underbust 79 -> band 34 (idx1); bustDifference 12 -> cup A (idx0)
    // chosen 36C => band idx2 (+1), cup idx2 (+2) => total 3
    const fit = evaluateFit(
      wearable('bra', '36C'),
      body({ underbust: 79, bustDifference: 12 }),
      undefined,
      config,
    );
    expect(fit.totalMismatch).toBe(3);
    expect(fit.perDimension.map((d) => d.mismatch)).toEqual([1, 2]);
  });

  it('handles compound trouser fit independently per dimension', () => {
    // waist 80 -> 32 (idx1); inseam 75 -> 30 (idx0); chosen 32/32 => length +1
    const fit = evaluateFit(
      wearable('trousers', '32/32'),
      body({ waist: 80, inseam: 75 }),
      undefined,
      config,
    );
    expect(fit.perDimension.find((d) => d.name === 'waist')?.mismatch).toBe(0);
    expect(fit.perDimension.find((d) => d.name === 'length')?.mismatch).toBe(1);
    expect(fit.totalMismatch).toBe(1);
  });
});

describe('idealSizeLabels', () => {
  it('returns the per-dimension ideal labels', () => {
    const labels = idealSizeLabels(
      sizeSystems.trousers,
      body({ waist: 80, inseam: 75 }),
      undefined,
      config,
    );
    expect(labels).toEqual({ waist: '32', length: '30' });
    expect(formatSize(sizeSystems.trousers, labels)).toBe('32/30');
  });
});

describe('estimatePlayerSizes', () => {
  it('formats the estimated size of each configured preview system', () => {
    const sizes = estimatePlayerSizes(
      body({
        chest: 100,
        waist: 80,
        inseam: 75,
        underbust: 78,
        bustDifference: 14,
      }),
      undefined,
      config,
    );
    // 'shoe-uk' is absent from the fixture so it is skipped.
    expect(sizes).toEqual([
      { label: 'Tops', size: 'M' },
      { label: 'Trousers', size: '32/30' },
      { label: 'Bra', size: '34B' },
    ]);
  });
});

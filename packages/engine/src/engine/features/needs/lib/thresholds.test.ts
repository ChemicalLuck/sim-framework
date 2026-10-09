import { describe, expect, it } from 'vitest';

import type { Effect } from '@chemicalluck/sim-engine/types';

import type { NeedThreshold } from '../types';
import { crossedThresholds } from './thresholds';

const fx = (id: string): Effect[] => [{ kind: 'money', amount: id.length }];
const t = (at: number, when?: 'rising' | 'falling'): NeedThreshold => ({
  at,
  ...(when ? { when } : {}),
  effects: fx(String(at)),
});

describe('crossedThresholds', () => {
  it('fires a normal need threshold when falling to or past it', () => {
    const thresholds = { Hunger: [t(20), t(0)] };
    expect(
      crossedThresholds({ Hunger: 30 }, { Hunger: 15 }, thresholds, {}),
    ).toEqual([t(20)]);
    expect(
      crossedThresholds({ Hunger: 30 }, { Hunger: 0 }, thresholds, {}),
    ).toEqual([t(20), t(0)]);
  });

  it('does not fire when rising past a normal need threshold', () => {
    expect(
      crossedThresholds(
        { Hunger: 10 },
        { Hunger: 30 },
        { Hunger: [t(20)] },
        {},
      ),
    ).toEqual([]);
  });

  it('does not fire again while staying past the threshold', () => {
    expect(
      crossedThresholds({ Hunger: 10 }, { Hunger: 5 }, { Hunger: [t(20)] }, {}),
    ).toEqual([]);
  });

  it('fires an inverse need threshold when rising to or past it', () => {
    const options = { Drunk: { direction: 'inverse' as const } };
    const thresholds = { Drunk: [t(100)] };
    expect(
      crossedThresholds({ Drunk: 90 }, { Drunk: 100 }, thresholds, options),
    ).toEqual([t(100)]);
    expect(
      crossedThresholds({ Drunk: 100 }, { Drunk: 90 }, thresholds, options),
    ).toEqual([]);
  });

  it('honours an explicit crossing direction', () => {
    const thresholds = { Hunger: [t(50, 'rising')] };
    expect(
      crossedThresholds({ Hunger: 40 }, { Hunger: 60 }, thresholds, {}),
    ).toEqual([t(50, 'rising')]);
    expect(
      crossedThresholds({ Hunger: 60 }, { Hunger: 40 }, thresholds, {}),
    ).toEqual([]);
  });

  it('ignores needs without thresholds or missing values', () => {
    expect(crossedThresholds({ Fun: 50 }, { Fun: 0 }, {}, {})).toEqual([]);
    expect(
      crossedThresholds({}, { Hunger: 0 }, { Hunger: [t(10)] }, {}),
    ).toEqual([]);
  });
});

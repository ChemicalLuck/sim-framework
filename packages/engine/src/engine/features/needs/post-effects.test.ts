import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import { advanceTimeByMinutes } from '@chemicalluck/sim-engine/features/time/slice';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { configureNeedThresholds } from './lib/thresholds';
import postEffects from './post-effects';
import { configureNeeds, decayNeedsByMinutes } from './slice';

const [needsPostEffect] = postEffects;

function state(timestamp: number, needs: Record<string, number>): RootState {
  return { present: { time: { timestamp }, needs } } as unknown as RootState;
}

function run(
  effects: Effect[],
  prev: RootState,
  next: RootState,
  after: RootState = next,
) {
  const actions: unknown[] = [];
  const dispatch = vi.fn((a: unknown) => {
    if (typeof a === 'function') {
      return (a as (d: unknown, g: () => RootState) => unknown)(
        dispatch,
        () => after,
      );
    }
    actions.push(a);
    return a;
  });
  needsPostEffect({
    dispatch: dispatch,
    group: 'g',
    effects,
    prevState: prev,
    newState: next,
  });
  // Strip the group meta added by dispatchWithGroup.
  return actions.map((a) => {
    const { type, payload } = a as UnknownAction & { payload?: unknown };
    return { type, payload };
  });
}

describe('needs post-effect', () => {
  it('decays needs for clock time advanced by any effect', () => {
    configureNeeds({ needs: { Energy: 100 }, decayRates: { Energy: 60 } });
    configureNeedThresholds({});
    // An extension effect advanced the clock directly, without a `time` effect.
    const actions = run(
      [{ kind: 'custom' } as unknown as Effect],
      state(0, { Energy: 100 }),
      state(45 * 60_000, { Energy: 100 }),
    );
    expect(actions).toContainEqual(
      decayNeedsByMinutes({ minutes: 45, sleep: false }),
    );
    expect(actions).not.toContainEqual(advanceTimeByMinutes(45));
  });

  it('does not double-count slept time as awake time', () => {
    configureNeeds({ needs: { Energy: 100 }, decayRates: { Energy: 60 } });
    configureNeedThresholds({});
    const actions = run(
      [{ kind: 'sleep', hours: 2 }],
      state(0, { Energy: 100 }),
      state(120 * 60_000, { Energy: 100 }),
    );
    expect(actions).toEqual([
      decayNeedsByMinutes({ minutes: 120, sleep: true }),
    ]);
  });

  it('applies threshold effects when a need crosses a threshold', () => {
    configureNeeds({ needs: { Hunger: 100 }, decayRates: { Hunger: 0 } });
    const penalty: Effect = { kind: 'money', amount: -5 };
    configureNeedThresholds({ Hunger: [{ at: 20, effects: [penalty] }] });
    const dispatched: unknown[] = [];
    const dispatch = vi.fn((a: unknown) => {
      dispatched.push(a);
      if (typeof a === 'function') {
        return (a as (d: unknown, g: () => RootState) => unknown)(
          dispatch,
          () => state(0, { Hunger: 10 }),
        );
      }
      return a;
    });
    needsPostEffect({
      dispatch: dispatch,
      group: 'g',
      effects: [{ kind: 'needs', need: 'Hunger', delta: -40 }],
      prevState: state(0, { Hunger: 50 }),
      newState: state(0, { Hunger: 10 }),
    });
    // One thunk checks thresholds; it dispatches processEffects for the crossing.
    const thunks = dispatched.filter((a) => typeof a === 'function');
    expect(thunks).toHaveLength(2);
  });
});

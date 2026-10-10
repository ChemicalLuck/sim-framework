import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import type { EffectContext } from '@chemicalluck/sim-engine/features/core/types';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { handleWeatherEffect } from './effects';
import { setWeatherOverride } from './slice';
import type { WeatherEffect } from './types';

const NOW = Date.UTC(2025, 2, 10, 9, 0);
const HOUR = 3_600_000;

/** Runs the handler with the clock at `now` (e.g. after earlier effects in the batch). */
function run(effect: WeatherEffect, now = NOW) {
  const state = {
    present: { time: { timestamp: now } },
  } as unknown as RootState;
  const actions: UnknownAction[] = [];
  const dispatch = vi.fn((a: unknown): unknown => {
    if (typeof a === 'function') {
      return (a as (d: unknown, g: () => RootState) => unknown)(
        dispatch,
        () => state,
      );
    }
    actions.push(a as UnknownAction);
    return a;
  });
  const ctx = {
    dispatch,
    group: 'g',
    prevState: { present: { time: { timestamp: NOW } } },
    effects: [effect],
  } as unknown as EffectContext;
  handleWeatherEffect(effect, ctx);
  return actions.map(({ type, payload }) => ({ type, payload }));
}

describe('weather effect', () => {
  it('sets a permanent override as before', () => {
    expect(run({ kind: 'weather', conditionId: 'rainy' })).toEqual([
      setWeatherOverride({ conditionId: 'rainy' }),
    ]);
  });

  it('clears the override with null', () => {
    expect(run({ kind: 'weather', conditionId: null })).toEqual([
      setWeatherOverride(null),
    ]);
  });

  it('expires durationHours after the current game time', () => {
    expect(
      run(
        { kind: 'weather', conditionId: 'snowy', durationHours: 3 },
        NOW + 2 * HOUR,
      ),
    ).toEqual([
      setWeatherOverride({ conditionId: 'snowy', until: NOW + 5 * HOUR }),
    ]);
  });

  it('expires at an ISO until timestamp', () => {
    expect(
      run({
        kind: 'weather',
        conditionId: 'snowy',
        until: '2025-03-10T18:30:00',
      }),
    ).toEqual([
      setWeatherOverride({
        conditionId: 'snowy',
        until: Date.UTC(2025, 2, 10, 18, 30),
      }),
    ]);
  });

  it('overrides the temperature', () => {
    expect(
      run({ kind: 'weather', conditionId: 'hot_sunny', temperature: 35 }),
    ).toEqual([
      setWeatherOverride({ conditionId: 'hot_sunny', temperature: 35 }),
    ]);
  });
});

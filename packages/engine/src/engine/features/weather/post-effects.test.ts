import type { UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';

import { increaseNeedByAmount } from '@chemicalluck/sim-engine/features/needs/slice';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Effect } from '@chemicalluck/sim-engine/types';

import { computeHourWeather } from './lib/weather';
import postEffects, { WEATHER_SLEEP_FACTOR } from './post-effects';
import { clearExpiredWeatherOverride } from './slice';

const HOUR = 60 * 60_000;
const ENERGY_DRAIN: Partial<Record<string, number>> = {
  snowy: 2,
  freezing: 3,
  rainy: 1,
  light_rain: 0.5,
};
const START = new Date(2025, 0, 10, 22, 0).getTime();

function state(
  timestamp: number,
  override: string | null = null,
  seed = 1,
  overrideUntil?: number,
): RootState {
  return {
    present: {
      time: { timestamp },
      rng: { seed },
      weather: { conditionOverride: override, overrideUntil },
    },
  } as unknown as RootState;
}

function dispatched(effects: Effect[], prev: RootState, next: RootState) {
  const actions: UnknownAction[] = [];
  const dispatch = vi.fn((a: unknown) => {
    actions.push(a as UnknownAction);
    return a;
  });
  for (const postEffect of postEffects) {
    postEffect({
      dispatch,
      group: 'g',
      effects,
      prevState: prev,
      newState: next,
    });
  }
  return actions;
}

/** Sum of the need deltas dispatched, per need. */
function run(effects: Effect[], prev: RootState, next: RootState) {
  const totals: Partial<Record<string, number>> = {};
  for (const a of dispatched(effects, prev, next)) {
    if (!increaseNeedByAmount.match(a)) continue;
    const { need, amount } = a.payload;
    totals[need] = (totals[need] ?? 0) + amount;
  }
  return totals;
}

describe('weather override expiry', () => {
  it('drains for the override only until it expires', () => {
    const until = START + 2 * HOUR;
    const totals = run(
      [{ kind: 'time', hours: 6, minutes: 0 }],
      state(START, 'freezing', 1, until),
      state(START + 6 * HOUR, 'freezing', 1, until),
    );
    let expected = -2 * 3;
    for (let t = until; t < START + 6 * HOUR; t += HOUR) {
      const id = computeHourWeather(
        new Date(t),
        new Date(t).getHours(),
        1,
      ).conditionId;
      expected -= ENERGY_DRAIN[id] ?? 0;
    }
    expect(totals.Energy ?? 0).toBeCloseTo(expected);
  });

  it('clears the override once game time passes until', () => {
    const until = START + HOUR;
    const actions = dispatched(
      [{ kind: 'time', hours: 2, minutes: 0 }],
      state(START, 'rainy', 1, until),
      state(START + 2 * HOUR, 'rainy', 1, until),
    );
    expect(
      actions.map(({ type, payload }) => ({ type, payload })),
    ).toContainEqual(clearExpiredWeatherOverride(START + 2 * HOUR));
  });

  it('keeps an override that has not expired yet', () => {
    const actions = dispatched(
      [{ kind: 'time', hours: 1, minutes: 0 }],
      state(START, 'rainy', 1, START + 5 * HOUR),
      state(START + HOUR, 'rainy', 1, START + 5 * HOUR),
    );
    expect(actions.some((a) => clearExpiredWeatherOverride.match(a))).toBe(
      false,
    );
  });
});

describe('weather need-drain post-effect', () => {
  it('drains needs for time advanced by a time effect', () => {
    const totals = run(
      [{ kind: 'time', hours: 2, minutes: 0 }],
      state(START, 'rainy'),
      state(START + 2 * HOUR, 'rainy'),
    );
    expect(totals.Energy).toBeCloseTo(-2);
  });

  it('applies the drain (with the sleep factor) when sleeping through rain', () => {
    const totals = run(
      [{ kind: 'sleep', hours: 8 }],
      state(START, 'rainy'),
      state(START + 8 * HOUR, 'rainy'),
    );
    expect(totals.Energy).toBeCloseTo(-8 * WEATHER_SLEEP_FACTOR);
    expect(WEATHER_SLEEP_FACTOR).toBeGreaterThan(0);
    expect(WEATHER_SLEEP_FACTOR).toBeLessThan(1);
  });

  it('applies to clock time advanced by any effect', () => {
    const totals = run(
      [{ kind: 'custom' } as unknown as Effect],
      state(START, 'snowy'),
      state(START + 30 * 60_000, 'snowy'),
    );
    expect(totals.Energy).toBeCloseTo(-1);
    expect(totals.Hunger).toBeCloseTo(-1.5);
  });

  it('splits awake and asleep time within one batch', () => {
    const totals = run(
      [
        { kind: 'time', hours: 1, minutes: 0 },
        { kind: 'sleep', hours: 4 },
      ],
      state(START, 'freezing'),
      state(START + 5 * HOUR, 'freezing'),
    );
    expect(totals.Energy).toBeCloseTo(-(3 * 1 + 3 * 4 * WEATHER_SLEEP_FACTOR));
  });

  it('uses the weather of each elapsed hour, not only the final one', () => {
    const seed = 5;
    // Find a day whose hours change between a draining and a non-draining condition.
    const drains: Record<string, number> = {
      snowy: 2,
      freezing: 3,
      rainy: 1,
      light_rain: 0.5,
    };
    for (let day = 0; day < 365; day++) {
      const start = new Date(2025, 0, 1 + day, 0, 0).getTime();
      const hourly = Array.from({ length: 24 }, (_, h) =>
        computeHourWeather(new Date(start + h * HOUR), h, seed),
      );
      const expected = hourly.reduce(
        (sum, w) => sum - (drains[w.conditionId] ?? 0),
        0,
      );
      const last = drains[hourly[23].conditionId] ?? 0;
      if (expected === -last * 24) continue;
      const totals = run(
        [{ kind: 'time', hours: 24, minutes: 0 }],
        state(start, null, seed),
        state(start + 24 * HOUR, null, seed),
      );
      expect(totals.Energy ?? 0).toBeCloseTo(expected);
      return;
    }
    throw new Error('no day with changing weather found');
  });

  it('does nothing when no time passed', () => {
    expect(run([], state(START, 'rainy'), state(START, 'rainy'))).toEqual({});
  });
});

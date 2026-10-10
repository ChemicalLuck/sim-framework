import { afterEach, describe, expect, it } from 'vitest';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import evaluators, { comparisonParsers } from './conditions';
import { hydrateWeather } from './hydrate';
import { configureWeather } from './lib/config';
import { computeHourWeather } from './lib/weather';

describe('weather comparison parser', () => {
  const parse = comparisonParsers[0];

  afterEach(() => {
    configureWeather(null);
  });

  it('rejects unknown conditions', () => {
    expect(() => parse('weather', '==', 'heatwave')).toThrow(/Unknown weather/);
  });

  it('accepts conditions added by weather.json', () => {
    configureWeather(
      hydrateWeather({
        conditions: {
          heatwave: { label: 'Heatwave', tempMin: 30, tempMax: 38 },
        },
      }),
    );
    expect(parse('weather', '==', 'heatwave')).toEqual({
      kind: 'weather',
      conditionId: 'heatwave',
    });
  });
});

function stateAt(timestamp: number, seed: number): RootState {
  return {
    present: {
      time: { timestamp },
      rng: { seed },
      weather: { conditionOverride: null },
    },
  } as unknown as RootState;
}

describe('weather condition evaluator', () => {
  it('uses the game seed when computing the current hour weather', () => {
    const seed = 12345;
    const start = new Date('2025-01-01T12:00:00').getTime();
    const day = 24 * 60 * 60 * 1000;
    // Find a day where the seeded and unseeded weather differ.
    let ts = start;
    for (let i = 0; i < 365; i++, ts += day) {
      const d = new Date(ts);
      if (
        computeHourWeather(d, 12, seed).conditionId !==
        computeHourWeather(d, 12, 0).conditionId
      )
        break;
    }
    const expected = computeHourWeather(new Date(ts), 12, seed).conditionId;
    expect(expected).not.toBe(
      computeHourWeather(new Date(ts), 12, 0).conditionId,
    );

    expect(
      evaluators.weather(
        { kind: 'weather', conditionId: expected },
        stateAt(ts, seed),
      ),
    ).toBe(true);
  });

  it('honours the override', () => {
    const state = stateAt(0, 1) as unknown as {
      present: { weather: { conditionOverride: string } };
    };
    state.present.weather.conditionOverride = 'snowy';
    expect(
      evaluators.weather(
        { kind: 'weather', conditionId: 'snowy' },
        state as unknown as RootState,
      ),
    ).toBe(true);
  });
});

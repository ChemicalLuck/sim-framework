import { describe, expect, it } from 'vitest';

import type { Effect } from '@chemicalluck/sim-engine/types';

import editors from './effect-editor';

const { weather } = editors;

const roundTrip = (effect: Effect) =>
  weather.buildEffect(weather.toFormState(effect));

describe('weather effect editor', () => {
  it('round-trips existing effects unchanged', () => {
    for (const effect of [
      { kind: 'weather', conditionId: 'rainy' },
      { kind: 'weather', conditionId: null },
      {
        kind: 'weather',
        conditionId: 'snowy',
        durationHours: 3,
        temperature: -4,
      },
      { kind: 'weather', conditionId: 'windy', until: '2025-03-01T18:00:00' },
    ] as Effect[]) {
      expect(roundTrip(effect)).toEqual(effect);
    }
  });

  it('builds a timed override with a temperature', () => {
    expect(
      weather.buildEffect({
        ...weather.defaultState,
        conditionId: 'hot_sunny',
        durationHours: '6',
        temperature: '34',
      }),
    ).toEqual({
      kind: 'weather',
      conditionId: 'hot_sunny',
      durationHours: 6,
      temperature: 34,
    });
  });

  it('drops expiry and temperature when clearing', () => {
    expect(
      weather.buildEffect({
        ...weather.defaultState,
        conditionId: null,
        durationHours: '6',
        temperature: '34',
      }),
    ).toEqual({ kind: 'weather', conditionId: null });
  });

  it('labels timed overrides', () => {
    expect(
      weather.label({
        kind: 'weather',
        conditionId: 'snowy',
        durationHours: 3,
        temperature: -4,
      }),
    ).toBe('weather:snowy 3h -4°C');
  });
});

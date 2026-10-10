import { describe, expect, it } from 'vitest';

import reducer, {
  clearExpiredWeatherOverride,
  setWeatherOverride,
} from './slice';

describe('weather slice', () => {
  it('starts with no override', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      conditionOverride: null,
    });
  });

  it('setWeatherOverride records the supplied condition id', () => {
    const next = reducer(
      { conditionOverride: null },
      setWeatherOverride('rainy'),
    );
    expect(next.conditionOverride).toBe('rainy');
  });

  it('setWeatherOverride can clear the override', () => {
    const next = reducer(
      { conditionOverride: 'rainy' },
      setWeatherOverride(null),
    );
    expect(next.conditionOverride).toBeNull();
  });

  it('records an expiry and temperature, and clearing drops them', () => {
    const set = reducer(
      { conditionOverride: null },
      setWeatherOverride({ conditionId: 'snowy', until: 500, temperature: -8 }),
    );
    expect(set).toEqual({
      conditionOverride: 'snowy',
      overrideUntil: 500,
      temperatureOverride: -8,
    });
    expect(reducer(set, setWeatherOverride(null))).toEqual({
      conditionOverride: null,
    });
    // A plain id replaces a timed override with a permanent one.
    expect(reducer(set, setWeatherOverride('rainy'))).toEqual({
      conditionOverride: 'rainy',
    });
  });

  it('clearExpiredWeatherOverride clears only once game time reaches until', () => {
    const timed = { conditionOverride: 'snowy', overrideUntil: 500 };
    expect(reducer(timed, clearExpiredWeatherOverride(499))).toEqual(timed);
    expect(reducer(timed, clearExpiredWeatherOverride(500))).toEqual({
      conditionOverride: null,
    });
    const permanent = { conditionOverride: 'snowy' };
    expect(reducer(permanent, clearExpiredWeatherOverride(1e15))).toEqual(
      permanent,
    );
  });
});

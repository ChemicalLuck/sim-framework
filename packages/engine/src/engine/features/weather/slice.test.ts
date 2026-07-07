import { describe, expect, it } from 'vitest';

import reducer, { setWeatherOverride } from './slice';

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
});

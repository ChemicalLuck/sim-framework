import { describe, expect, it } from 'vitest';

import { selectNarrativeVars } from '@chemicalluck/sim-engine/features/linguistics/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import evaluators from './conditions';
import { computeDayWeather, computeHourWeather } from './lib/weather';
import {
  getWeatherAt,
  selectDayWeather,
  selectTemperature,
  selectWeather,
  selectWeatherOverride,
} from './selectors';

function stateAt(
  timestamp: number,
  seed: number,
  weather: object = { conditionOverride: null },
): RootState {
  return {
    present: {
      time: { timestamp },
      rng: { seed },
      weather,
      npcs: { characters: [], named: [], nearby: [] },
    },
  } as unknown as RootState;
}

describe('weather override', () => {
  const start = Date.UTC(2025, 0, 6, 8, 0);
  const HOUR = 3_600_000;
  const timed = {
    conditionOverride: 'hot_sunny',
    overrideUntil: start + 3 * HOUR,
    temperatureOverride: 41,
  };
  const computed = (ts: number) => stateAt(ts, 4);

  it('applies until the expiry game time', () => {
    const before = stateAt(start + 3 * HOUR - 60_000, 4, timed);
    expect(selectWeather(before).conditionId).toBe('hot_sunny');
    expect(selectWeatherOverride(before)).toBe('hot_sunny');
    expect(
      evaluators.weather({ kind: 'weather', conditionId: 'hot_sunny' }, before),
    ).toBe(true);
  });

  it('stops applying once game time reaches until', () => {
    const after = stateAt(start + 3 * HOUR, 4, timed);
    expect(selectWeather(after)).toEqual(
      selectWeather(computed(start + 3 * HOUR)),
    );
    expect(selectWeatherOverride(after)).toBeNull();
  });

  it('overrides the temperature in selectors and template variables', () => {
    const during = stateAt(start + HOUR, 4, timed);
    expect(selectTemperature(during)).toBe(41);
    expect(selectNarrativeVars(during)).toMatchObject({
      weather: 'hot_sunny',
      temperature: 41,
    });
  });

  it('keeps the computed temperature without a temperature override', () => {
    const plain = stateAt(start + HOUR, 4, { conditionOverride: 'rainy' });
    expect(selectWeather(plain).conditionId).toBe('rainy');
    expect(selectTemperature(plain)).toBe(
      selectTemperature(computed(start + HOUR)),
    );
  });

  it('getWeatherAt honours the expiry per timestamp', () => {
    const state = stateAt(start, 4, timed);
    expect(getWeatherAt(state, start + 2 * HOUR).conditionId).toBe('hot_sunny');
    expect(getWeatherAt(state, start + 4 * HOUR)).toEqual(
      selectWeather(computed(start + 4 * HOUR)),
    );
  });
});

/** A day (as midnight timestamp) whose weather changes between two hours. */
function changingDay(seed: number): { start: number; a: number; b: number } {
  for (let day = 0; day < 365; day++) {
    const date = new Date(Date.UTC(2025, 0, 1 + day, 12));
    const hours = Array.from(
      { length: 24 },
      (_, h) => computeHourWeather(date, h, seed).conditionId,
    );
    const b = hours.findIndex((id) => id !== hours[0]);
    if (b > 0) {
      return { start: Date.UTC(2025, 0, 1 + day, 0), a: 0, b };
    }
  }
  throw new Error('no changing day');
}

describe('weather selectors', () => {
  const seed = 99;
  const { start, a, b } = changingDay(seed);
  const at = (hour: number) => stateAt(start + hour * 3_600_000, seed);

  it('selectWeather reports the current hour', () => {
    const date = new Date(start);
    expect(selectWeather(at(a)).conditionId).toBe(
      computeHourWeather(date, a, seed).conditionId,
    );
    expect(selectWeather(at(b)).conditionId).toBe(
      computeHourWeather(date, b, seed).conditionId,
    );
    expect(selectWeather(at(a)).conditionId).not.toBe(
      selectWeather(at(b)).conditionId,
    );
    expect(selectTemperature(at(b))).toBe(
      computeHourWeather(date, b, seed).temperature,
    );
  });

  it('selectDayWeather keeps the daily forecast', () => {
    expect(selectDayWeather(at(b))).toEqual(
      computeDayWeather(new Date(start + b * 3_600_000), seed),
    );
  });

  it('weather == evaluates the current hour', () => {
    const idB = selectWeather(at(b)).conditionId;
    expect(
      evaluators.weather({ kind: 'weather', conditionId: idB }, at(b)),
    ).toBe(true);
    expect(
      evaluators.weather({ kind: 'weather', conditionId: idB }, at(a)),
    ).toBe(false);
  });

  it('template variables use the current hour', () => {
    const w = selectWeather(at(b));
    expect(selectNarrativeVars(at(b))).toMatchObject({
      weather: w.conditionId,
      weatherLabel: w.condition.label,
      temperature: w.temperature,
    });
  });
});

import { describe, expect, it } from 'vitest';

import { selectNarrativeVars } from '@chemicalluck/sim-engine/features/linguistics/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import evaluators from './conditions';
import { computeDayWeather, computeHourWeather } from './lib/weather';
import {
  selectDayWeather,
  selectTemperature,
  selectWeather,
} from './selectors';

function stateAt(timestamp: number, seed: number): RootState {
  return {
    present: {
      time: { timestamp },
      rng: { seed },
      weather: { conditionOverride: null },
      npcs: { characters: [], named: [], nearby: [] },
    },
  } as unknown as RootState;
}

/** A day (as midnight timestamp) whose weather changes between two hours. */
function changingDay(seed: number): { start: number; a: number; b: number } {
  for (let day = 0; day < 365; day++) {
    const date = new Date(2025, 0, 1 + day, 12);
    const hours = Array.from(
      { length: 24 },
      (_, h) => computeHourWeather(date, h, seed).conditionId,
    );
    const b = hours.findIndex((id) => id !== hours[0]);
    if (b > 0) {
      return { start: new Date(2025, 0, 1 + day, 0).getTime(), a: 0, b };
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

import { describe, expect, it } from 'vitest';

import { computeDayWeather, computeHourWeather } from './weather';

function dayAt(year: number, dayIndex: number): Date {
  return new Date(year, 0, 1 + dayIndex, 12);
}

function hoursOf(date: Date, seed: number) {
  return Array.from({ length: 24 }, (_, h) =>
    computeHourWeather(date, h, seed),
  );
}

describe('computeHourWeather', () => {
  it('is deterministic for a seed', () => {
    const date = dayAt(2025, 100);
    expect(hoursOf(date, 42)).toEqual(hoursOf(date, 42));
  });

  it('changes within a day on some days', () => {
    let changing = 0;
    for (let i = 0; i < 365; i++) {
      const ids = new Set(hoursOf(dayAt(2025, i), 7).map((w) => w.conditionId));
      if (ids.size > 1) changing++;
    }
    expect(changing).toBeGreaterThan(30);
    expect(changing).toBeLessThan(365);
  });

  it('is dominated by the daily condition', () => {
    for (let i = 0; i < 365; i += 7) {
      const date = dayAt(2025, i);
      const daily = computeDayWeather(date, 3).conditionId;
      const matching = hoursOf(date, 3).filter(
        (w) => w.conditionId === daily,
      ).length;
      expect(matching).toBeGreaterThanOrEqual(8);
    }
  });

  it('follows a temperature curve: afternoons are warmer than nights', () => {
    let warmerAfternoons = 0;
    for (let i = 0; i < 365; i += 5) {
      const date = dayAt(2025, i);
      const hours = hoursOf(date, 11);
      if (hours[15].temperature > hours[3].temperature) warmerAfternoons++;
    }
    expect(warmerAfternoons).toBeGreaterThan(60);
  });

  it('reports the hour and season', () => {
    const w = computeHourWeather(new Date(2025, 6, 4, 12), 9, 1);
    expect(w.hour).toBe(9);
    expect(w.seasonId).toBe('summer');
  });
});

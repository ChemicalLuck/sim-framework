import { afterEach, describe, expect, it } from 'vitest';

import {
  gameDay,
  gameDayOfYear,
  gameHour,
  gameMonth,
  gameWeekday,
  nextGameHour,
  parseGameDate,
} from './game-time';

const originalTz = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTz;
});

// Saturday 4 January 2025, 23:30 UTC — a different day/hour in most timezones.
const ts = Date.UTC(2025, 0, 4, 23, 30);

describe('game-time', () => {
  it.each(['UTC', 'Pacific/Kiritimati', 'America/Los_Angeles', 'Asia/Kolkata'])(
    'reads the clock identically with host TZ=%s',
    (tz) => {
      process.env.TZ = tz;
      expect(gameHour(ts)).toBe(23);
      expect(gameWeekday(ts)).toBe(6);
      expect(gameDay(ts)).toBe(4);
      expect(gameMonth(ts)).toBe(1);
      expect(gameDayOfYear(ts)).toBe(4);
      expect(parseGameDate('2025-01-01T08:00:00')).toBe(
        Date.UTC(2025, 0, 1, 8),
      );
    },
  );

  it('parseGameDate reads zoneless date-times as UTC and honours offsets', () => {
    expect(parseGameDate('2025-01-01T08:00')).toBe(Date.UTC(2025, 0, 1, 8));
    expect(parseGameDate('2025-01-01')).toBe(Date.UTC(2025, 0, 1));
    expect(parseGameDate('2025-01-01T08:00:00Z')).toBe(Date.UTC(2025, 0, 1, 8));
    expect(parseGameDate('2025-01-01T08:00:00+02:00')).toBe(
      Date.UTC(2025, 0, 1, 6),
    );
  });

  it('weekday is 0 = Sunday … 6 = Saturday', () => {
    expect(gameWeekday(Date.UTC(2025, 0, 5))).toBe(0);
    expect(gameWeekday(Date.UTC(2025, 0, 6))).toBe(1);
  });

  it('nextGameHour finds the next occurrence of an hour', () => {
    expect(nextGameHour(Date.UTC(2025, 0, 1, 6), 8)).toBe(
      Date.UTC(2025, 0, 1, 8),
    );
    expect(nextGameHour(Date.UTC(2025, 0, 1, 22), 8)).toBe(
      Date.UTC(2025, 0, 2, 8),
    );
    expect(nextGameHour(Date.UTC(2025, 0, 1, 8), 8)).toBe(
      Date.UTC(2025, 0, 2, 8),
    );
  });
});

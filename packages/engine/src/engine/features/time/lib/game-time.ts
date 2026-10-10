/**
 * Calendar maths for the in-game clock.
 *
 * Game timestamps are epoch milliseconds, but the clock is read in a fixed
 * timezone (UTC) so that hours, weekdays and seasons are identical on every
 * host. Never read the game clock with the local-time `Date` getters.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** ISO date-time with no `Z`/`±hh:mm` offset, e.g. `2025-01-01T08:00:00`. */
const ZONELESS_DATE_TIME = /T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Parse an authored ISO date into a game timestamp. A date-time without an
 * explicit offset is read as UTC (game wall-clock time), not host-local time,
 * so `2025-01-01T08:00:00` always starts the game at 08:00.
 */
export function parseGameDate(iso: string): number {
  return new Date(ZONELESS_DATE_TIME.test(iso) ? `${iso}Z` : iso).getTime();
}

/** Hour of day, 0–23. */
export function gameHour(timestamp: number): number {
  return new Date(timestamp).getUTCHours();
}

/** Minute of the hour, 0–59. */
export function gameMinute(timestamp: number): number {
  return new Date(timestamp).getUTCMinutes();
}

/** Day of week, 0 = Sunday … 6 = Saturday (same convention as `Date.getDay()`). */
export function gameWeekday(timestamp: number): number {
  return new Date(timestamp).getUTCDay();
}

/** Day of the month, 1–31. */
export function gameDay(timestamp: number): number {
  return new Date(timestamp).getUTCDate();
}

/** Month of the year, 1 = January … 12 = December. */
export function gameMonth(timestamp: number): number {
  return new Date(timestamp).getUTCMonth() + 1;
}

/** Full year, e.g. 2025. */
export function gameYear(timestamp: number): number {
  return new Date(timestamp).getUTCFullYear();
}

/** Day of the year, 1 = 1 January. */
export function gameDayOfYear(timestamp: number): number {
  return Math.floor(
    (timestamp - Date.UTC(gameYear(timestamp), 0, 0)) / MS_PER_DAY,
  );
}

/** `timestamp` moved by a whole number of days (negative to go back). */
export function addGameDays(timestamp: number, days: number): number {
  return timestamp + days * MS_PER_DAY;
}

/**
 * The next time the clock reads `hour`:00 — later today if that hour is still
 * ahead, otherwise tomorrow.
 */
export function nextGameHour(timestamp: number, hour: number): number {
  const d = new Date(timestamp);
  const target = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    hour,
  );
  return gameHour(timestamp) >= hour ? addGameDays(target, 1) : target;
}

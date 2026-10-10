import { Mulberry32 } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import {
  addGameDays,
  gameDayOfYear,
  gameHour,
  gameMonth,
  gameYear,
} from '@chemicalluck/sim-engine/features/time/lib/game-time';

import type {
  DailyWeather,
  HourlyWeather,
  SeasonId,
  WeatherConditionId,
  WeightedCondition,
} from '../types';
import { getWeatherCondition, getWeatherConfig } from './config';

// Dates are read in game (UTC) time via time/lib/game-time, so the day's
// weather and season don't depend on the host's timezone.

function dayOfYear(date: Date): number {
  return gameDayOfYear(date.getTime());
}

function daySeed(date: Date): number {
  return dayOfYear(date) + gameYear(date.getTime()) * 366;
}

export function getSeason(date: Date): SeasonId {
  const m = gameMonth(date.getTime());
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 8) return 'summer';
  return 'autumn';
}

const SEASON_POOLS: Record<SeasonId, WeatherConditionId[]> = {
  winter: ['snowy', 'freezing', 'rainy', 'overcast', 'cloudy'],
  spring: ['sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'rainy', 'windy'],
  summer: ['sunny', 'hot_sunny', 'partly_cloudy', 'cloudy', 'light_rain'],
  autumn: [
    'overcast',
    'rainy',
    'windy',
    'cloudy',
    'light_rain',
    'partly_cloudy',
  ],
};

/** The season's weighted pool: `weather.json` weights, or the built-in pool weighted evenly. */
function seasonPool(season: SeasonId): WeightedCondition[] {
  return (
    getWeatherConfig().seasons[season] ??
    SEASON_POOLS[season].map((id) => ({ id, weight: 1 }))
  );
}

/** Pick from a weighted pool with a uniform roll in [0, 1). */
function weightedPick(
  pool: WeightedCondition[],
  roll: number,
): WeatherConditionId {
  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let x = roll * total;
  for (const c of pool) {
    if (x < c.weight) return c.id;
    x -= c.weight;
  }
  return pool[pool.length - 1].id;
}

/** How far apart two conditions are in precipitation and mid temperature. */
function conditionDistance(a: WeatherConditionId, b: WeatherConditionId) {
  const ca = getWeatherCondition(a);
  const cb = getWeatherCondition(b);
  const midA = (ca.tempMin + ca.tempMax) / 2;
  const midB = (cb.tempMin + cb.tempMax) / 2;
  return (
    Math.abs(ca.precipitationChance - cb.precipitationChance) +
    Math.abs(midA - midB) / 10
  );
}

function pickCondition(date: Date, masterSeed = 0): WeatherConditionId {
  const pool = seasonPool(getSeason(date));
  const rng = new Mulberry32((daySeed(date) ^ masterSeed) >>> 0);

  const prevDate = new Date(addGameDays(date.getTime(), -1));
  const prevRng = new Mulberry32((daySeed(prevDate) ^ masterSeed) >>> 0);

  // Run prev day's RNG to get its condition
  const prevCondition = weightedPick(
    seasonPool(getSeason(prevDate)),
    prevRng.next(),
  );

  const persistence = rng.next();

  // Persist: keep yesterday's condition, or drift to the closest one
  if (persistence < getWeatherConfig().persistence) {
    if (pool.some((c) => c.id === prevCondition)) return prevCondition;
    // Yesterday's condition is out of season (the season just turned):
    // drift to the most similar condition in today's pool.
    const distances = pool.map((c) => conditionDistance(prevCondition, c.id));
    const nearest = Math.min(...distances);
    const closest = pool.filter((_, i) => distances[i] === nearest);
    return closest[Math.floor(rng.next() * closest.length)].id;
  }

  // Otherwise pick freely from pool
  return weightedPick(pool, rng.next());
}

function computeTemperature(
  date: Date,
  conditionId: WeatherConditionId,
  masterSeed = 0,
): number {
  const doy = dayOfYear(date);
  // UK seasonal sine: peaks ~late July (doy ~210), troughs ~late Jan (doy ~30)
  const base = 14 + 11 * Math.sin(((doy - 80) * 2 * Math.PI) / 365);
  const cond = getWeatherCondition(conditionId);
  const rng = new Mulberry32((daySeed(date) ^ 0xdeadbeef ^ masterSeed) >>> 0);
  const range = cond.tempMax - cond.tempMin;
  const noise = rng.next() * range;
  // Blend base temp toward condition range
  const blended = cond.tempMin + noise * 0.6 + (base - 14) * 0.4;
  return Math.round(Math.max(cond.tempMin, Math.min(cond.tempMax, blended)));
}

export function computeDayWeather(date: Date, masterSeed = 0): DailyWeather {
  const conditionId = pickCondition(date, masterSeed);
  return {
    conditionId,
    condition: getWeatherCondition(conditionId),
    temperature: computeTemperature(date, conditionId, masterSeed),
    seasonId: getSeason(date),
  };
}

/**
 * The day's condition for each hour: spells of 2–5 hours that either keep the
 * daily condition or switch to one of its closest in-season neighbours (a
 * shower on a cloudy day, a dry spell on a rainy one). Changeable conditions
 * (mid precipitation chance) vary most; settled ones barely at all.
 */
function dayPattern(date: Date, masterSeed: number): WeatherConditionId[] {
  const daily = pickCondition(date, masterSeed);
  const rng = new Mulberry32((daySeed(date) ^ 0x9e3779b9 ^ masterSeed) >>> 0);
  const p = getWeatherCondition(daily).precipitationChance;
  const variability = Math.min(0.45, 1.6 * p * (1 - p));
  const neighbours = seasonPool(getSeason(date))
    .map((c) => c.id)
    .filter((id) => id !== daily)
    .sort((a, b) => conditionDistance(daily, a) - conditionDistance(daily, b))
    .slice(0, 2);

  const hours: WeatherConditionId[] = [];
  while (hours.length < 24) {
    const length = 2 + Math.floor(rng.next() * 4);
    const id =
      neighbours.length > 0 && rng.next() < variability
        ? neighbours[Math.floor(rng.next() * neighbours.length)]
        : daily;
    for (let i = 0; i < length; i++) hours.push(id);
  }
  return hours.slice(0, 24);
}

/**
 * The weather at `hour` (0–23) of `date`'s day. The temperature follows a
 * daily curve around the day's temperature — warmest mid-afternoon, coldest
 * before dawn, flatter under cloud and rain — shifted toward the hour's
 * condition when it differs from the day's.
 */
export function computeHourWeather(
  date: Date,
  hour: number,
  masterSeed = 0,
): HourlyWeather {
  const day = computeDayWeather(date, masterSeed);
  const conditionId = dayPattern(date, masterSeed)[hour] ?? day.conditionId;
  const condition = getWeatherCondition(conditionId);
  const amplitude = 2 + 3 * (1 - condition.precipitationChance);
  const curve = amplitude * Math.cos((2 * Math.PI * (hour - 15)) / 24);
  const shift =
    (condition.tempMin +
      condition.tempMax -
      day.condition.tempMin -
      day.condition.tempMax) /
    4;
  return {
    conditionId,
    condition,
    temperature: Math.round(day.temperature + curve + shift),
    seasonId: day.seasonId,
    hour,
  };
}

/** The clock hour (0–23) of a game time, as `selectHour` reports it. */
export function hourOfDay(date: Date): number {
  return gameHour(date.getTime());
}

/** Milliseconds from a game time to the start of the next clock hour. */
export function msToNextHour(date: Date): number {
  return (
    ((60 - date.getUTCMinutes()) * 60 - date.getUTCSeconds()) * 1000 -
    date.getUTCMilliseconds()
  );
}

export function getWeatherForDay(
  date: Date,
  dayOffset: number,
  masterSeed = 0,
): DailyWeather {
  const d = new Date(addGameDays(date.getTime(), dayOffset));
  return computeDayWeather(d, masterSeed);
}

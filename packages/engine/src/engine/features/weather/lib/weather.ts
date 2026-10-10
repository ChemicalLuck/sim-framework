import { Mulberry32 } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import {
  addGameDays,
  gameDayOfYear,
  gameMonth,
  gameYear,
} from '@chemicalluck/sim-engine/features/time/lib/game-time';

import type {
  DailyWeather,
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

export function getWeatherForDay(
  date: Date,
  dayOffset: number,
  masterSeed = 0,
): DailyWeather {
  const d = new Date(addGameDays(date.getTime(), dayOffset));
  return computeDayWeather(d, masterSeed);
}

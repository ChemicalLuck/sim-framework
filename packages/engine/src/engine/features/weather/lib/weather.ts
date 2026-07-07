import { Mulberry32 } from '@chemicalluck/engine/features/rng/lib/rng';

import type { DailyWeather, SeasonId, WeatherConditionId } from '../types';
import { WEATHER_CONDITIONS } from './conditions';

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function daySeed(date: Date): number {
  return dayOfYear(date) + date.getFullYear() * 366;
}

export function getSeason(date: Date): SeasonId {
  const m = date.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
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

function pickCondition(date: Date, masterSeed = 0): WeatherConditionId {
  const season = getSeason(date);
  const pool = SEASON_POOLS[season];
  const rng = new Mulberry32((daySeed(date) ^ masterSeed) >>> 0);

  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevRng = new Mulberry32((daySeed(prevDate) ^ masterSeed) >>> 0);

  // Run prev day's RNG to get its condition
  const prevPoolForPrev = SEASON_POOLS[getSeason(prevDate)];
  const prevIndex = Math.floor(prevRng.next() * prevPoolForPrev.length);
  const prevCondition = prevPoolForPrev[prevIndex];

  const persistence = rng.next();

  // 65% chance: try to pick same or adjacent condition
  if (persistence < 0.65) {
    const sameIdx = pool.indexOf(prevCondition);
    if (sameIdx !== -1) return prevCondition;
    // Adjacent in pool
    const adjacent = [sameIdx - 1, sameIdx + 1]
      .filter((i) => i >= 0 && i < pool.length)
      .map((i) => pool[i]);
    if (adjacent.length > 0) {
      return adjacent[Math.floor(rng.next() * adjacent.length)];
    }
  }

  // Otherwise pick freely from pool
  return pool[Math.floor(rng.next() * pool.length)];
}

function computeTemperature(
  date: Date,
  conditionId: WeatherConditionId,
  masterSeed = 0,
): number {
  const doy = dayOfYear(date);
  // UK seasonal sine: peaks ~late July (doy ~210), troughs ~late Jan (doy ~30)
  const base = 14 + 11 * Math.sin(((doy - 80) * 2 * Math.PI) / 365);
  const cond = WEATHER_CONDITIONS[conditionId];
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
    condition: WEATHER_CONDITIONS[conditionId],
    temperature: computeTemperature(date, conditionId, masterSeed),
    seasonId: getSeason(date),
  };
}

export function getWeatherForDay(
  date: Date,
  dayOffset: number,
  masterSeed = 0,
): DailyWeather {
  const d = new Date(date);
  d.setDate(d.getDate() + dayOffset);
  return computeDayWeather(d, masterSeed);
}

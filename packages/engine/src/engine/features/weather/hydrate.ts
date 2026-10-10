import type { JsonWeatherConfig } from './authoring.types';
import { WEATHER_CONDITIONS } from './lib/conditions';
import { DEFAULT_PERSISTENCE } from './lib/config';
import type {
  SeasonId,
  WeatherCondition,
  WeatherConditionId,
  WeatherConfig,
  WeightedCondition,
} from './types';

declare module '@chemicalluck/sim-engine/data' {
  interface ContentExtensions {
    weather: WeatherConfig;
  }
}

const SEASON_IDS: readonly SeasonId[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
];

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function hydrateConditions(
  raw: JsonWeatherConfig['conditions'] = {},
): Record<WeatherConditionId, WeatherCondition> {
  const conditions: Record<WeatherConditionId, WeatherCondition> = {
    ...WEATHER_CONDITIONS,
  };
  for (const [id, def] of Object.entries(raw)) {
    const base = Object.hasOwn(WEATHER_CONDITIONS, id)
      ? WEATHER_CONDITIONS[id]
      : undefined;
    const label = def.label ?? base?.label;
    const tempMin = def.tempMin ?? base?.tempMin;
    const tempMax = def.tempMax ?? base?.tempMax;
    if (!label || !isFiniteNumber(tempMin) || !isFiniteNumber(tempMax)) {
      throw new Error(
        `weather.json: new condition '${id}' needs label, tempMin and tempMax`,
      );
    }
    if (tempMin > tempMax) {
      throw new Error(`weather.json: condition '${id}' has tempMin > tempMax`);
    }
    const precipitationChance =
      def.precipitationChance ?? base?.precipitationChance ?? 0;
    if (precipitationChance < 0 || precipitationChance > 1) {
      throw new Error(
        `weather.json: condition '${id}' precipitationChance must be 0–1`,
      );
    }
    const needEffects = def.needEffects ?? base?.needEffects ?? {};
    for (const [need, rate] of Object.entries(needEffects)) {
      if (!isFiniteNumber(rate)) {
        throw new Error(
          `weather.json: condition '${id}' needEffects.${need} must be a number`,
        );
      }
    }
    const wetsClothing = def.wetsClothing ?? base?.wetsClothing ?? false;
    if (typeof wetsClothing !== 'boolean') {
      throw new Error(
        `weather.json: condition '${id}' wetsClothing must be true or false`,
      );
    }
    conditions[id] = {
      id,
      label,
      tempMin,
      tempMax,
      precipitationChance,
      iconName: def.iconName ?? base?.iconName ?? 'Cloud',
      iconColor: def.iconColor ?? base?.iconColor ?? 'text-zinc-400',
      needEffects: { ...needEffects },
      wetsClothing,
    };
  }
  return conditions;
}

/** Validate `weather.json` and resolve it against the built-in conditions. */
export function hydrateWeather(data: JsonWeatherConfig): WeatherConfig {
  const conditions = hydrateConditions(data.conditions);

  const persistence = data.persistence ?? DEFAULT_PERSISTENCE;
  if (!isFiniteNumber(persistence) || persistence < 0 || persistence > 1) {
    throw new Error('weather.json: persistence must be between 0 and 1');
  }

  const seasons: WeatherConfig['seasons'] = {};
  for (const [season, weights] of Object.entries(data.seasons ?? {})) {
    if (!(SEASON_IDS as readonly string[]).includes(season)) {
      throw new Error(`weather.json: unknown season '${season}'`);
    }
    const pool: WeightedCondition[] = [];
    for (const [id, weight] of Object.entries(weights)) {
      if (!Object.hasOwn(conditions, id)) {
        throw new Error(
          `weather.json: season '${season}' weights unknown condition '${id}'`,
        );
      }
      if (!isFiniteNumber(weight) || weight < 0) {
        throw new Error(
          `weather.json: weight for '${id}' in '${season}' must be a non-negative number`,
        );
      }
      if (weight > 0) pool.push({ id, weight });
    }
    if (pool.length === 0) {
      throw new Error(
        `weather.json: season '${season}' needs at least one positive weight`,
      );
    }
    seasons[season as SeasonId] = pool;
  }

  return { seasons, persistence, conditions };
}

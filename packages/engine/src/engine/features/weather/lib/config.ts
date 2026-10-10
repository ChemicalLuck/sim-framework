import { makeConfig } from '@chemicalluck/sim-engine/lib/core';

import type {
  WeatherCondition,
  WeatherConditionId,
  WeatherConfig,
} from '../types';
import { WEATHER_CONDITIONS } from './conditions';

export const DEFAULT_PERSISTENCE = 0.65;

const DEFAULT_CONFIG: WeatherConfig = {
  seasons: {},
  persistence: DEFAULT_PERSISTENCE,
  conditions: WEATHER_CONDITIONS,
};

const _config = makeConfig<WeatherConfig>(DEFAULT_CONFIG);

/** Install the hydrated `weather.json`; `null` restores the built-in defaults. */
export function configureWeather(config: WeatherConfig | null): void {
  _config.configure(config ?? DEFAULT_CONFIG);
}

export function getWeatherConfig(): WeatherConfig {
  return _config.get();
}

/** All known conditions: built-ins plus any `weather.json` overrides/additions. */
export function getWeatherConditions(): Readonly<
  Record<WeatherConditionId, WeatherCondition>
> {
  return _config.get().conditions;
}

export function isWeatherConditionId(id: string): boolean {
  return Object.hasOwn(getWeatherConditions(), id);
}

/** Look up a condition, falling back to `cloudy` for an unknown id (e.g. a stale save). */
export function getWeatherCondition(id: WeatherConditionId): WeatherCondition {
  const conditions = getWeatherConditions();
  return Object.hasOwn(conditions, id) ? conditions[id] : conditions.cloudy;
}

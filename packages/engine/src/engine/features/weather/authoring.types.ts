import type { SeasonId } from './types';

/** A condition override (any subset of fields) or addition (label + temperature range required). */
export interface JsonWeatherCondition {
  label?: string;
  tempMin?: number;
  tempMax?: number;
  /** 0–1 chance of precipitation. */
  precipitationChance?: number;
  /** Lucide icon name: Sun, Cloud, CloudRain, CloudSnow, Snowflake or Wind. */
  iconName?: string;
  /** Tailwind text colour class for the icon. */
  iconColor?: string;
}

/** Optional `weather.json`. Every field is optional; omitted parts keep the built-in behaviour. */
export interface JsonWeatherConfig {
  /** Relative weights by condition id per season, e.g. `{ "winter": { "snowy": 0.1, "rainy": 0.3 } }`. */
  seasons?: Partial<Record<SeasonId, Record<string, number>>>;
  /** Chance (0–1) a day keeps the previous day's condition. Default 0.65. */
  persistence?: number;
  /** Overrides of built-in conditions, or new conditions, keyed by id. */
  conditions?: Record<string, JsonWeatherCondition>;
}

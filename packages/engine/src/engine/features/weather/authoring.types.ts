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
  /**
   * Need drains while this condition holds, as need name → points per hour,
   * e.g. `{ "Energy": 1 }`. Replaces a built-in condition's drains; default none.
   */
  needEffects?: Record<string, number>;
  /** Whether it wets equipped clothing outdoors (without an umbrella). Default false. */
  wetsClothing?: boolean;
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

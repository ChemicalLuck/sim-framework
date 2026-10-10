import type { BaseEffect } from '@chemicalluck/sim-engine/types';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

/** The conditions the engine ships with. */
export type BuiltinWeatherConditionId =
  | 'sunny'
  | 'hot_sunny'
  | 'partly_cloudy'
  | 'cloudy'
  | 'overcast'
  | 'light_rain'
  | 'rainy'
  | 'windy'
  | 'snowy'
  | 'freezing';

/** A built-in condition id, or one added by the game's `weather.json`. */
export type WeatherConditionId = BuiltinWeatherConditionId | (string & {});

export interface WeatherCondition {
  id: WeatherConditionId;
  label: string;
  tempMin: number;
  tempMax: number;
  iconName: string;
  iconColor: string;
  precipitationChance: number;
}

export interface WeightedCondition {
  id: WeatherConditionId;
  weight: number;
}

/** Hydrated `weather.json`: per-season weights, persistence and condition definitions. */
export interface WeatherConfig {
  /** Weighted condition pools per season; a season left out uses the built-in pool. */
  seasons: Partial<Record<SeasonId, WeightedCondition[]>>;
  /** Chance a day keeps the previous day's condition (0–1). */
  persistence: number;
  /** All known conditions: the built-ins merged with the game's overrides/additions. */
  conditions: Record<WeatherConditionId, WeatherCondition>;
}

export interface DailyWeather {
  conditionId: WeatherConditionId;
  condition: WeatherCondition;
  temperature: number;
  seasonId: SeasonId;
}

/** The weather for one hour of a day: the daily condition plus intra-day variation. */
export interface HourlyWeather extends DailyWeather {
  hour: number;
}

export interface SeasonCondition {
  kind: 'season';
  seasonId: SeasonId;
}

export interface WeatherConditionExpr {
  kind: 'weather';
  conditionId: WeatherConditionId;
}

export interface WeatherEffect extends BaseEffect<'weather'> {
  /** Set a specific condition override, or null to clear and return to computed weather. */
  readonly conditionId: WeatherConditionId | null;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    weather: WeatherEffect;
  }
}

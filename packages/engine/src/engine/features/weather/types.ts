import type { BaseEffect } from '@chemicalluck/engine/types';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherConditionId =
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

export interface WeatherCondition {
  id: WeatherConditionId;
  label: string;
  tempMin: number;
  tempMax: number;
  iconName: string;
  iconColor: string;
  precipitationChance: number;
}

export interface DailyWeather {
  conditionId: WeatherConditionId;
  condition: WeatherCondition;
  temperature: number;
  seasonId: SeasonId;
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

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    weather: WeatherEffect;
  }
}

import {
  Cloud,
  CloudRain,
  CloudSnow,
  Snowflake,
  Sun,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { BuiltinWeatherConditionId, WeatherCondition } from '../types';

export const WEATHER_ICON_MAP: Record<BuiltinWeatherConditionId, LucideIcon> = {
  sunny: Sun,
  hot_sunny: Sun,
  partly_cloudy: Cloud,
  cloudy: Cloud,
  overcast: Cloud,
  light_rain: CloudRain,
  rainy: CloudRain,
  windy: Wind,
  snowy: CloudSnow,
  freezing: Snowflake,
};

/** Icons a condition's `iconName` may name. */
const ICONS_BY_NAME: Record<string, LucideIcon> = {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Snowflake,
  Wind,
};

/** The icon for a condition, by its `iconName` (falls back to a cloud). */
export function getWeatherIcon(condition: WeatherCondition): LucideIcon {
  return ICONS_BY_NAME[condition.iconName] ?? Cloud;
}

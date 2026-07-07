import {
  Cloud,
  CloudRain,
  CloudSnow,
  Snowflake,
  Sun,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { WeatherConditionId } from '../types';

export const WEATHER_ICON_MAP: Record<WeatherConditionId, LucideIcon> = {
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

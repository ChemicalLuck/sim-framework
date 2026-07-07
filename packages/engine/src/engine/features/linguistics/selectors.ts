import { createSelector } from '@reduxjs/toolkit';
import { selectNearbyNpcsCount } from '@sim/engine/features/npcs/selectors';
import { selectHour, selectTimeOfDay } from '@sim/engine/features/time/selectors';
import {
  selectSeason,
  selectTemperature,
  selectWeather,
  selectWeatherConditionId,
} from '@sim/engine/features/weather/selectors';

/**
 * Global narrative variables exposed to description templates: current weather,
 * time of day and nearby-NPC count. Merged into the template variable context
 * alongside a character's own attributes. The keys here must match
 * `NARRATIVE_VAR_NAMES` in `./lib/variables` (the linter's known-variable list).
 */
export const selectNarrativeVars = createSelector(
  selectTimeOfDay,
  selectHour,
  selectWeatherConditionId,
  selectWeather,
  selectSeason,
  selectTemperature,
  selectNearbyNpcsCount,
  (
    timeOfDay,
    hour,
    weather,
    weatherInfo,
    season,
    temperature,
    totalNearbyNpcs,
  ): Record<string, string | number> => ({
    timeOfDay,
    hour,
    weather,
    weatherLabel: weatherInfo.condition.label,
    season,
    temperature,
    totalNearbyNpcs,
  }),
);

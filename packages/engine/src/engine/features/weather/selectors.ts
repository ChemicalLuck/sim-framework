import { createSelector } from '@reduxjs/toolkit';

import {
  selectDate,
  selectHour,
  selectTimestamp,
} from '@chemicalluck/sim-engine/features/time/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { getWeatherCondition } from './lib/config';
import {
  computeDayWeather,
  computeHourWeather,
  getSeason,
  hourOfDay,
} from './lib/weather';
import type { DailyWeather, HourlyWeather, WeatherOverride } from './types';

const selectWeatherState = (state: RootState) => state.present.weather;

/** The override active at `timestamp` (a timed one stops applying at its expiry). */
function activeOverride(
  weather: RootState['present']['weather'],
  timestamp: number,
): WeatherOverride | null {
  const { conditionOverride, overrideUntil, temperatureOverride } = weather;
  if (!conditionOverride) return null;
  if (overrideUntil !== undefined && timestamp >= overrideUntil) return null;
  return { conditionId: conditionOverride, temperature: temperatureOverride };
}

const selectActiveOverride = createSelector(
  [selectWeatherState, selectTimestamp],
  activeOverride,
);

/** The active override's condition id, or null when the weather is computed. */
export const selectWeatherOverride = (state: RootState) =>
  selectActiveOverride(state)?.conditionId ?? null;

export const selectGameSeed = (state: RootState) => state.present.rng.seed;

export const selectSeason = createSelector([selectDate], (date) =>
  getSeason(date),
);

function applyOverride(
  weather: HourlyWeather,
  override: WeatherOverride | null,
): HourlyWeather {
  if (!override) return weather;
  return {
    ...weather,
    conditionId: override.conditionId,
    condition: getWeatherCondition(override.conditionId),
    temperature: override.temperature ?? weather.temperature,
  };
}

/** Today's overall weather (the forecast view), ignoring hourly variation and overrides. */
export const selectDayWeather = createSelector(
  [selectDate, selectGameSeed],
  (date, gameSeed): DailyWeather => computeDayWeather(date, gameSeed),
);

/** The weather right now: the current hour's computed weather, or the override. */
export const selectWeather = createSelector(
  [selectDate, selectHour, selectActiveOverride, selectGameSeed],
  (date, hour, override, gameSeed): HourlyWeather =>
    applyOverride(computeHourWeather(date, hour, gameSeed), override),
);

/** The weather at another game time, using the state's seed and override. */
export function getWeatherAt(
  state: RootState,
  timestamp: number,
): HourlyWeather {
  const date = new Date(timestamp);
  return applyOverride(
    computeHourWeather(date, hourOfDay(date), selectGameSeed(state)),
    activeOverride(selectWeatherState(state), timestamp),
  );
}

export const selectTemperature = createSelector(
  [selectWeather],
  (w) => w.temperature,
);

export const selectWeatherConditionId = createSelector(
  [selectWeather],
  (w) => w.conditionId,
);

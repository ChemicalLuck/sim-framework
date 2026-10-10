import { createSelector } from '@reduxjs/toolkit';

import {
  selectDate,
  selectHour,
} from '@chemicalluck/sim-engine/features/time/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { getWeatherCondition } from './lib/config';
import {
  computeDayWeather,
  computeHourWeather,
  getSeason,
  hourOfDay,
} from './lib/weather';
import type { DailyWeather, HourlyWeather, WeatherConditionId } from './types';

export const selectWeatherOverride = (state: RootState) =>
  state.present.weather.conditionOverride;

export const selectGameSeed = (state: RootState) => state.present.rng.seed;

export const selectSeason = createSelector([selectDate], (date) =>
  getSeason(date),
);

function applyOverride(
  weather: HourlyWeather,
  override: WeatherConditionId | null,
): HourlyWeather {
  if (!override) return weather;
  return {
    ...weather,
    conditionId: override,
    condition: getWeatherCondition(override),
  };
}

/** Today's overall weather (the forecast view), ignoring hourly variation and overrides. */
export const selectDayWeather = createSelector(
  [selectDate, selectGameSeed],
  (date, gameSeed): DailyWeather => computeDayWeather(date, gameSeed),
);

/** The weather right now: the current hour's computed weather, or the override. */
export const selectWeather = createSelector(
  [selectDate, selectHour, selectWeatherOverride, selectGameSeed],
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
    selectWeatherOverride(state),
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

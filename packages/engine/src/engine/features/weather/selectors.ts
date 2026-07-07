import { createSelector } from '@reduxjs/toolkit';
import { selectDate } from '@chemicalluck/sim-engine/features/time/selectors';
import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { WEATHER_CONDITIONS } from './lib/conditions';
import { computeDayWeather, getSeason } from './lib/weather';
import type { DailyWeather } from './types';

export const selectWeatherOverride = (state: RootState) =>
  state.present.weather.conditionOverride;

export const selectGameSeed = (state: RootState) => state.present.rng.seed;

export const selectSeason = createSelector([selectDate], (date) =>
  getSeason(date),
);

export const selectWeather = createSelector(
  [selectDate, selectWeatherOverride, selectGameSeed],
  (date, override, gameSeed): DailyWeather => {
    const base = computeDayWeather(date, gameSeed);
    if (override) {
      const cond = WEATHER_CONDITIONS[override];
      return { ...base, conditionId: override, condition: cond };
    }
    return base;
  },
);

export const selectTemperature = createSelector(
  [selectWeather],
  (w) => w.temperature,
);

export const selectWeatherConditionId = createSelector(
  [selectWeather],
  (w) => w.conditionId,
);

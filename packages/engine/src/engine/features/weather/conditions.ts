import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { computeDayWeather, getSeason } from './lib/weather';
import type { SeasonCondition, WeatherConditionExpr } from './types';

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ConditionMap {
    season: SeasonCondition;
    weather: WeatherConditionExpr;
  }
}

export const conditionSerializers = {
  season: (c: SeasonCondition) => `season == '${c.seasonId}'`,
  weather: (c: WeatherConditionExpr) => `weather == '${c.conditionId}'`,
};

export default {
  season: (cond: SeasonCondition, state: RootState): boolean =>
    getSeason(new Date(state.present.time.timestamp)) === cond.seasonId,

  weather: (cond: WeatherConditionExpr, state: RootState): boolean => {
    const override = state.present.weather.conditionOverride;
    const id =
      override ??
      computeDayWeather(new Date(state.present.time.timestamp)).conditionId;
    return id === cond.conditionId;
  },
};

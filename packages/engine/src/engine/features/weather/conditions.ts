import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { WEATHER_CONDITIONS } from './lib/conditions';
import { selectSeason, selectWeatherConditionId } from './selectors';
import type {
  SeasonCondition,
  SeasonId,
  WeatherConditionExpr,
  WeatherConditionId,
} from './types';

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ConditionMap {
    season: SeasonCondition;
    weather: WeatherConditionExpr;
  }
}

const SEASON_IDS: readonly SeasonId[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
];

function isSeasonId(value: string): value is SeasonId {
  return (SEASON_IDS as readonly string[]).includes(value);
}

function isWeatherConditionId(value: string): value is WeatherConditionId {
  return value in WEATHER_CONDITIONS;
}

export const comparisonParsers = [
  (
    id: string,
    op: string,
    value: string | number,
  ): SeasonCondition | WeatherConditionExpr | null => {
    if (id !== 'season' && id !== 'weather') return null;
    if (op !== '==' && op !== '=') {
      throw new Error(`'${id}' only supports == comparisons`);
    }
    const v = String(value);
    if (id === 'season') {
      if (!isSeasonId(v)) {
        throw new Error(
          `Unknown season '${v}' (expected ${SEASON_IDS.join(', ')})`,
        );
      }
      return { kind: 'season', seasonId: v };
    }
    if (!isWeatherConditionId(v)) {
      throw new Error(
        `Unknown weather '${v}' (expected ${Object.keys(WEATHER_CONDITIONS).join(', ')})`,
      );
    }
    return { kind: 'weather', conditionId: v };
  },
];

export const conditionSerializers = {
  season: (c: SeasonCondition) => `season == '${c.seasonId}'`,
  weather: (c: WeatherConditionExpr) => `weather == '${c.conditionId}'`,
};

export default {
  season: (cond: SeasonCondition, state: RootState): boolean =>
    selectSeason(state) === cond.seasonId,

  weather: (cond: WeatherConditionExpr, state: RootState): boolean =>
    selectWeatherConditionId(state) === cond.conditionId,
};

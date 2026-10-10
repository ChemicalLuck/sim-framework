import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { getWeatherConditions, isWeatherConditionId } from './lib/config';
import { selectSeason, selectWeatherConditionId } from './selectors';
import type { SeasonCondition, SeasonId, WeatherConditionExpr } from './types';

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
        `Unknown weather '${v}' (expected ${Object.keys(getWeatherConditions()).join(', ')})`,
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

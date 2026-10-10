import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { gameDay, gameHour, gameMonth, gameWeekday } from './lib/game-time';

export interface GameTimeExpr {
  kind: 'gametime';
}

export interface GameHourExpr {
  kind: 'gamehour';
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export interface GameWeekdayExpr {
  kind: 'gameweekday';
}

/** Day of the month, 1–31. */
export interface GameDayExpr {
  kind: 'gameday';
}

/** Month of the year, 1 = January … 12 = December. */
export interface GameMonthExpr {
  kind: 'gamemonth';
}

type TimeExpr =
  | GameTimeExpr
  | GameHourExpr
  | GameWeekdayExpr
  | GameDayExpr
  | GameMonthExpr;

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    gametime: GameTimeExpr;
    gamehour: GameHourExpr;
    gameweekday: GameWeekdayExpr;
    gameday: GameDayExpr;
    gamemonth: GameMonthExpr;
  }
}

export const exprKinds: TimeExpr['kind'][] = [
  'gametime',
  'gamehour',
  'gameweekday',
  'gameday',
  'gamemonth',
];

export const exprParsers = [
  (id: string): TimeExpr | null => {
    const kind = exprKinds.find((k) => k === id);
    return kind ? { kind } : null;
  },
];

const timestamp = (state: RootState) => state.present.time.timestamp;

// Clock values are read in UTC (see lib/game-time) so they don't depend on
// the host's timezone.
export const exprEvaluators = {
  gametime: (_e: GameTimeExpr, state: RootState): number => timestamp(state),
  gamehour: (_e: GameHourExpr, state: RootState): number =>
    gameHour(timestamp(state)),
  gameweekday: (_e: GameWeekdayExpr, state: RootState): number =>
    gameWeekday(timestamp(state)),
  gameday: (_e: GameDayExpr, state: RootState): number =>
    gameDay(timestamp(state)),
  gamemonth: (_e: GameMonthExpr, state: RootState): number =>
    gameMonth(timestamp(state)),
};

export const exprSerializers = {
  gametime: () => 'gametime',
  gamehour: () => 'gamehour',
  gameweekday: () => 'gameweekday',
  gameday: () => 'gameday',
  gamemonth: () => 'gamemonth',
};

export default {};

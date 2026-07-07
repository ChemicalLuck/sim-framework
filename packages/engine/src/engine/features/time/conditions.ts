import type { RootState } from '@chemicalluck/engine/state/store';

export interface GameTimeExpr {
  kind: 'gametime';
}

export interface GameHourExpr {
  kind: 'gamehour';
}

declare module '@chemicalluck/engine/types/condition.types' {
  interface ExprMap {
    gametime: GameTimeExpr;
    gamehour: GameHourExpr;
  }
}

export const exprKinds = ['gametime', 'gamehour'];

export const exprParsers = [
  (id: string): GameTimeExpr | GameHourExpr | null => {
    if (id === 'gametime') return { kind: 'gametime' };
    if (id === 'gamehour') return { kind: 'gamehour' };
    return null;
  },
];

export const exprEvaluators = {
  gametime: (_e: GameTimeExpr, state: RootState): number =>
    state.present.time.timestamp,
  gamehour: (_e: GameHourExpr, state: RootState): number =>
    new Date(state.present.time.timestamp).getHours(),
};

export const exprSerializers = {
  gametime: () => 'gametime',
  gamehour: () => 'gamehour',
};

export default {};

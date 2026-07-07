import type { RootState } from '@chemicalluck/engine/state/store';

export interface MoneyExpr {
  kind: 'money';
}

declare module '@chemicalluck/engine/types/condition.types' {
  interface ExprMap {
    money: MoneyExpr;
  }
}

export const exprKinds = ['money'];

export const exprParsers = [
  (id: string): MoneyExpr | null => {
    if (id !== 'money') return null;
    return { kind: 'money' };
  },
];

export const exprEvaluators = {
  money: (_e: MoneyExpr, state: RootState): number => state.present.money,
};

export const exprSerializers = {
  money: () => 'money',
};

export default {};

import type { RootState } from '@sim/engine/state/store';

import type { Need } from './types';

export interface NeedExpr {
  kind: 'need';
  need: Need;
}

declare module '@sim/engine/types/condition.types' {
  interface ExprMap {
    need: NeedExpr;
  }
}

export const exprKinds = ['need'];

export const exprParsers = [
  (id: string): NeedExpr | null => {
    if (!id.startsWith('need.')) return null;
    return { kind: 'need', need: id.slice('need.'.length) };
  },
];

export const exprEvaluators = {
  need: (e: NeedExpr, state: RootState): number => state.present.needs[e.need],
};

export const exprSerializers = {
  need: (e: NeedExpr) => `need.${e.need}`,
};

export default {};

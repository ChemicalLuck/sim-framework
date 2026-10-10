import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { selectEquippedAttributeTotal } from './selectors';

/** Total of a numeric wearable attribute across equipped items: `equipped.warmth`. */
export interface EquippedExpr {
  kind: 'equipped';
  attribute: string;
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    equipped: EquippedExpr;
  }
}

export const exprKinds = ['equipped'];

export const exprParsers = [
  (id: string): EquippedExpr | null => {
    if (!id.startsWith('equipped.')) return null;
    const attribute = id.slice('equipped.'.length);
    return attribute ? { kind: 'equipped', attribute } : null;
  },
];

export const exprEvaluators = {
  equipped: (e: EquippedExpr, state: RootState): number =>
    selectEquippedAttributeTotal(state, e.attribute),
};

export const exprSerializers = {
  equipped: (e: EquippedExpr) => `equipped.${e.attribute}`,
};

export default {};

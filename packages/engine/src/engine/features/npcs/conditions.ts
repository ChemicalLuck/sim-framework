import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { selectNearbyNpcsCount } from './selectors';

/** Number of NPCs at the player's current location. */
export interface NearbyExpr {
  kind: 'nearby';
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    nearby: NearbyExpr;
  }
}

export const exprKinds = ['nearby'];

export const exprParsers = [
  (id: string): NearbyExpr | null => {
    if (id !== 'nearby') return null;
    return { kind: 'nearby' };
  },
];

export const exprEvaluators = {
  nearby: (_e: NearbyExpr, state: RootState): number =>
    selectNearbyNpcsCount(state),
};

export const exprSerializers = {
  nearby: () => 'nearby',
};

export default {};

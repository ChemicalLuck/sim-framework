import type { RootState } from '@sim/engine/state/store';

export interface NpcNeedExpr {
  kind: 'npcNeed';
  need: string;
}

declare module '@sim/engine/types/condition.types' {
  interface ExprMap {
    npcNeed: NpcNeedExpr;
  }
}

export const exprKinds = ['npcNeed'];

export const exprParsers = [
  (id: string): NpcNeedExpr | null => {
    if (!id.startsWith('npcNeed.')) return null;
    return { kind: 'npcNeed', need: id.slice('npcNeed.'.length) };
  },
];

export const exprEvaluators = {
  npcNeed: (e: NpcNeedExpr, state: RootState): number =>
    state.present.encounter.npcNeeds[e.need] ?? 0,
};

export const exprSerializers = {
  npcNeed: (e: NpcNeedExpr) => `npcNeed.${e.need}`,
};

export default {};

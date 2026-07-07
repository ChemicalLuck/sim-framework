import type { RootState } from '@chemicalluck/sim-engine/state/store';

export interface SkillExpr {
  kind: 'skill';
  skill: string;
}

export interface LocationExpr {
  kind: 'location';
}

declare module '@chemicalluck/sim-engine/types/condition.types' {
  interface ExprMap {
    skill: SkillExpr;
    location: LocationExpr;
  }
}

export const exprKinds = ['skill', 'location'];

export const exprParsers = [
  (id: string): SkillExpr | null => {
    if (!id.startsWith('skill.')) return null;
    return { kind: 'skill', skill: id.slice('skill.'.length) };
  },
  (id: string): LocationExpr | null => {
    if (id !== 'location') return null;
    return { kind: 'location' };
  },
];

export const exprEvaluators = {
  skill: (e: SkillExpr, state: RootState): number =>
    state.present.player.skills[e.skill] ?? 0,
  location: (_e: LocationExpr, state: RootState): string =>
    state.present.player.locationId,
};

export const exprSerializers = {
  skill: (e: SkillExpr) => `skill.${e.skill}`,
  location: () => 'location',
};

export default {};

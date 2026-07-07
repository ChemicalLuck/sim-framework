import type { RootState } from '@chemicalluck/engine/state/store';

import type { MilestoneCondition } from './types';

declare module '@chemicalluck/engine/types/condition.types' {
  interface ConditionMap {
    milestone: MilestoneCondition;
  }
}

export const conditionParsers = [
  (id: string): MilestoneCondition | null => {
    if (!id.startsWith('milestone.')) return null;
    return { kind: 'milestone', milestoneId: id.slice('milestone.'.length) };
  },
];

export const conditionSerializers = {
  milestone: (c: MilestoneCondition) => `milestone.${c.milestoneId}`,
};

export default {
  milestone: (cond: MilestoneCondition, state: RootState): boolean =>
    state.present.milestones.achieved.includes(cond.milestoneId),
};

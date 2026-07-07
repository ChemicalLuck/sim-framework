import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';

export interface Milestone {
  id: string;
  title: string;
}

export interface MilestoneCondition {
  kind: 'milestone';
  milestoneId: string;
}

export interface MilestoneEffect extends BaseEffect<'milestone'> {
  readonly milestoneId: string;
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    milestone: MilestoneEffect;
  }
}

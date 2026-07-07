import type { RelationshipMetric } from '@sim/engine/features/npcs/types';
import type { BaseEffect } from '@sim/engine/types/effect.types';

export interface RelationshipEffect extends BaseEffect<'relationship'> {
  readonly npcId: string;
  readonly metric: RelationshipMetric;
  readonly delta: number;
}

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    relationship: RelationshipEffect;
  }
}

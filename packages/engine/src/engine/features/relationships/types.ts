import type { RelationshipMetric } from '@chemicalluck/sim-engine/features/npcs/types';
import type { BaseEffect } from '@chemicalluck/sim-engine/types/effect.types';

export interface RelationshipEffect extends BaseEffect<'relationship'> {
  readonly npcId: string;
  readonly metric: RelationshipMetric;
  readonly delta: number;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    relationship: RelationshipEffect;
  }
}

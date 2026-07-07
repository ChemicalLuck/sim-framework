import type { RelationshipMetric } from '@chemicalluck/engine/features/npcs/types';
import type { BaseEffect } from '@chemicalluck/engine/types/effect.types';

export interface RelationshipEffect extends BaseEffect<'relationship'> {
  readonly npcId: string;
  readonly metric: RelationshipMetric;
  readonly delta: number;
}

declare module '@chemicalluck/engine/types/effect.types' {
  interface EffectMap {
    relationship: RelationshipEffect;
  }
}

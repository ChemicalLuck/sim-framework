import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/engine/features/core/types';
import { updateRelationshipMetric } from '@chemicalluck/engine/features/relationships/slice';

import type { RelationshipEffect } from './types';

export function handleRelationshipEffect(
  effect: RelationshipEffect,
  { dispatch, group }: EffectContext,
) {
  dispatchWithGroup(
    dispatch,
    updateRelationshipMetric({
      npcId: effect.npcId,
      metric: effect.metric,
      delta: effect.delta,
    }),
    group,
  );
}

export default { relationship: handleRelationshipEffect };

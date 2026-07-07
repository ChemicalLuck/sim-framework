import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';
import { updateRelationshipMetric } from '@chemicalluck/sim-engine/features/relationships/slice';

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

import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';

import './effect-types';
import type { WearableConditionEffect } from './effect-types';
import { cleanItems } from './slice';

export function handleWearableConditionEffect(
  effect: WearableConditionEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const equipment = Object.values(prevState.present.player.equipment).filter(
    (w) => w != null,
  );
  const inventory = (prevState.present.containers.player ?? []).filter(
    (i) => i.kind === 'wearable',
  );
  const all = [...equipment, ...inventory];

  // Effect targets are authored template ids ('*' = all). Clothing state is
  // keyed by per-instance UUID, so resolve template id → instance ids here.
  const instanceIds =
    effect.target === '*'
      ? all.map((w) => w.instanceId).filter((id): id is string => id != null)
      : all
          .filter((w) => w.id === effect.target)
          .map((w) => w.instanceId)
          .filter((id): id is string => id != null);

  const ids = [...new Set(instanceIds)];
  if (ids.length > 0) {
    dispatchWithGroup(dispatch, cleanItems({ ids }), group);
  }
  toast.success('Clothes laundered!');
}

export default { wearable_condition: handleWearableConditionEffect };

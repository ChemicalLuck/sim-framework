import { toast } from 'sonner';

import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/sim-engine/features/core/types';

import './effect-types';
import type {
  WearableConditionEffect,
  WearableConditionSet,
} from './effect-types';
import { cleanItems, setCondition } from './slice';

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
  const { set } = effect;
  if (ids.length > 0) {
    dispatchWithGroup(
      dispatch,
      set ? setCondition({ ids, ...set }) : cleanItems({ ids }),
      group,
    );
  }
  if (!effect.silent) toast.success(conditionToast(set));
}

function conditionToast(set: WearableConditionSet | undefined): string {
  if (!set) return 'Clothes laundered!';
  if (set.wet === true) return 'Your clothes got wet.';
  if (set.dirty === true) return 'Your clothes got dirty.';
  if (set.wet === false) return 'Your clothes dried off.';
  if (set.dirty === false) return 'Your clothes are clean.';
  return 'Your clothes changed.';
}

export default { wearable_condition: handleWearableConditionEffect };

import { toast } from 'sonner';
import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { equipItem } from '@sim/engine/features/player/slice';
import { GlobalLogger } from '@sim/engine/lib/logger';

import type { ApplyOutfitEffect } from './types';

const logger = GlobalLogger.child('outfits');

export function handleApplyOutfitEffect(
  effect: ApplyOutfitEffect,
  { dispatch, group, prevState }: EffectContext,
) {
  const outfit = prevState.present.outfits.find((o) => o.name === effect.name);
  if (!outfit) {
    logger.warn('No outfit found with name:', effect.name);
    return;
  }

  logger.debug('Applying outfit:', outfit.name);
  for (const wearable of Object.values(outfit.equipment)) {
    if (wearable) {
      dispatchWithGroup(dispatch, equipItem(wearable), group);
    }
  }
  toast(`Wearing outfit: ${outfit.name}`);
}

export default { applyOutfit: handleApplyOutfitEffect };

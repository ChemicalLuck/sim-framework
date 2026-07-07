import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { setLocation } from '@sim/engine/features/player/slice';
import { GlobalLogger } from '@sim/engine/lib/logger';

import type { TravelEffect } from './types';

const logger = GlobalLogger.child('travel');

export function handleTravelEffect(
  effect: TravelEffect,
  { dispatch, group }: EffectContext,
) {
  logger.debug('Traveling to location:', effect.newLocationId);
  dispatchWithGroup(dispatch, setLocation(effect.newLocationId), group);
}

export default { travel: handleTravelEffect };

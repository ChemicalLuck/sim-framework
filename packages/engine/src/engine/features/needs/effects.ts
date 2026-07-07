import {
  type EffectContext,
  dispatchWithGroup,
} from '@chemicalluck/engine/features/core/types';
// NPC needs live on the active encounter state — encounter slice owns them
import { updateNpcNeed } from '@chemicalluck/engine/features/encounter/slice';
import { GlobalLogger } from '@chemicalluck/engine/lib/logger';

import { increaseNeedByAmount } from './slice';
import type { NeedsEffect } from './types';

const logger = GlobalLogger.child('needs');

export function handleNeedsEffect(
  effect: NeedsEffect,
  { dispatch, group }: EffectContext,
) {
  if (effect.delta === 0) {
    logger.warn('Delta 0, skipping need change');
    return;
  }

  if (effect.target === 'npc') {
    logger.debug('Adjusting NPC need:', effect.need, 'delta:', effect.delta);
    dispatchWithGroup(
      dispatch,
      updateNpcNeed({ need: effect.need, delta: effect.delta }),
      group,
    );
    return;
  }

  logger.debug('Adjusting need:', effect.need, 'delta:', effect.delta);
  dispatchWithGroup(
    dispatch,
    increaseNeedByAmount({ need: effect.need, amount: effect.delta }),
    group,
  );
}

export default { needs: handleNeedsEffect };

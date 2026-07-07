import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import { meetNpc } from '@sim/engine/features/relationships/slice';

import type { NpcEffect } from './types';

export function handleNpcEffect(
  effect: NpcEffect,
  { dispatch, group }: EffectContext,
) {
  dispatchWithGroup(dispatch, meetNpc(effect.npcId), group);
}

export default { npc: handleNpcEffect };

import {
  type EffectContext,
  dispatchWithGroup,
} from '@sim/engine/features/core/types';
import type { Encounter } from '@sim/engine/features/encounter/types';
import { handleViewEffect } from '@sim/engine/features/view/effects';
import { GlobalLogger } from '@sim/engine/lib/logger';

import { startEncounter } from './slice';
import type { EncounterEffect } from './types';

const logger = GlobalLogger.child('encounter');

let _registry = new Map<string, Encounter>();

export function configureEncounters(encounters: Encounter[]) {
  _registry = new Map(encounters.map((e) => [e.id, e]));
}

export function handleEncounterEffect(
  effect: EncounterEffect,
  ctx: EffectContext,
) {
  const { dispatch, group } = ctx;
  const encounter = _registry.get(effect.encounterId);
  if (!encounter) {
    logger.warn(`Unknown encounter id: ${effect.encounterId}`);
    return;
  }
  dispatchWithGroup(
    dispatch,
    startEncounter({ encounter, npcId: effect.npcId }),
    group,
  );
  handleViewEffect(
    { kind: 'view', activeViewId: 'EncounterView', props: {} },
    ctx,
  );
}

export default { encounter: handleEncounterEffect };

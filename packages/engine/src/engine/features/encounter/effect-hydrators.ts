import { defineEffectHydrator } from '@sim/engine/data/effect-hydrators';
import type { JsonEffect } from '@sim/engine/features/core/types';

import type { JsonViewEncounterEffect } from './authoring.types';

const hydrators = [
  defineEffectHydrator(
    (e: JsonEffect): e is JsonViewEncounterEffect =>
      e.kind === 'view' && 'encounterId' in e,
    (e) => ({
      kind: 'encounter',
      encounterId: e.encounterId,
      npcId: e.npcId,
    }),
  ),
];

export default hydrators;

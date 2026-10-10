import { NEED_NAMESPACE } from '@chemicalluck/sim-engine/features/needs/references';
import type { ReferenceProvider } from '@chemicalluck/sim-engine/lib/validation';

import type { WearableConfig } from './lib/wearable-config';

export const referenceProviders: ReferenceProvider[] = [
  {
    // Only needs named explicitly in `clothingNeeds` are checked: the defaults
    // (Hygiene / Comfort) apply to every game, and a game that doesn't declare
    // them simply goes without that drain.
    file: 'wearables-config',
    section: 'wearables-config',
    collect: (data) => {
      const { hygiene, comfort } =
        (data as Partial<WearableConfig>).clothingNeeds ?? {};
      return [hygiene?.need, comfort?.need]
        .filter((need): need is string => typeof need === 'string')
        .map((id) => ({
          namespace: NEED_NAMESPACE,
          id,
          source: 'wearables-config',
          section: 'wearables-config',
        }));
    },
  },
];

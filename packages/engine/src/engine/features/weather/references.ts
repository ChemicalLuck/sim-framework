import { NEED_NAMESPACE } from '@chemicalluck/sim-engine/features/needs/references';
import type { ReferenceProvider } from '@chemicalluck/sim-engine/lib/validation';

import type { JsonWeatherConfig } from './authoring.types';

export const referenceProviders: ReferenceProvider[] = [
  {
    // Only `needEffects` written in weather.json are checked: the built-in
    // conditions' drains apply to every game, and a game that doesn't declare
    // those needs simply goes without them.
    file: 'weather',
    section: 'weather',
    collect: (data) =>
      Object.entries((data as JsonWeatherConfig).conditions ?? {}).flatMap(
        ([id, condition]) =>
          Object.keys(condition.needEffects ?? {}).map((need) => ({
            namespace: NEED_NAMESPACE,
            id: need,
            source: `weather:${id}`,
            section: 'weather',
          })),
      ),
  },
];

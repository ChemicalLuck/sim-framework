import type { HydrationContext } from '@sim/engine/features/core/hydrate';
import type { JsonEffect } from '@sim/engine/features/core/types';
import type { Effect } from '@sim/engine/types/effect.types';

export interface EffectHydrator {
  test: (e: JsonEffect) => boolean;
  hydrate: (e: JsonEffect, ctx: HydrationContext) => Effect;
}

export function defineEffectHydrator<J extends JsonEffect>(
  test: (e: JsonEffect) => e is J,
  hydrate: (e: J, ctx: HydrationContext) => Effect,
): EffectHydrator {
  return {
    test,
    hydrate: (e, ctx) => hydrate(e as J, ctx),
  };
}

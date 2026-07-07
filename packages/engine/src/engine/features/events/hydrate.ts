import type { HydrationContext } from '@sim/engine/features/core/hydrate';

import type { JsonRandomEvent } from './authoring.types';
import type { RandomEvent } from './types';

declare module '@sim/engine/data' {
  interface ContentExtensions {
    events: RandomEvent[];
  }
}

export function hydrateRandomEvent(
  eventJson: JsonRandomEvent,
  ctx: HydrationContext,
): RandomEvent {
  return {
    id: eventJson.id,
    probability: eventJson.probability,
    script: ctx.scripts.get(eventJson.scriptId),
    cancels: eventJson.cancels,
    condition: eventJson.condition,
  };
}

export function hydrateEvents(
  data: JsonRandomEvent[],
  ctx: HydrationContext,
): RandomEvent[] {
  return data.map((e) => hydrateRandomEvent(e, ctx));
}

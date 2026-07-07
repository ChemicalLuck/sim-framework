import { hydrateActionGroup } from '@sim/engine/features/core/hydrate';
import type { HydrationContext } from '@sim/engine/features/core/hydrate';
import type { LocationNode, WorldGraph } from '@sim/engine/features/travel/types';

import type { JsonLocation } from './authoring.types';
import type { Edge } from './types';

declare module '@sim/engine/data' {
  interface ContentExtensions {
    world: WorldGraph;
  }
}

export function hydrateLocation(
  locationJson: JsonLocation,
  ctx: HydrationContext,
): LocationNode {
  return {
    id: locationJson.id,
    name: locationJson.name,
    kind: locationJson.kind,
    parent: locationJson.parent,
    condition: locationJson.condition,
    nearby: locationJson.nearby as LocationNode['nearby'],
    description: locationJson.description,
    entryText: locationJson.entryText,
    actions: locationJson.actions?.map((g) => hydrateActionGroup(g, ctx)),
  };
}

export function hydrateWorld(
  data: { locations: JsonLocation[]; edges: Edge[] },
  ctx: HydrationContext,
): WorldGraph {
  return {
    locations: data.locations.map((l) => hydrateLocation(l, ctx)),
    edges: data.edges,
  };
}

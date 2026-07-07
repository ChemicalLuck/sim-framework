import type { LocationNode, WorldGraph } from '@chemicalluck/sim-engine/features/travel/types';

let _world: WorldGraph = { locations: [], edges: [] };

export function configureWorld(world: WorldGraph) {
  _world = world;
}

export function getWorld(): WorldGraph {
  return _world;
}

export function getLocationById(id?: string): LocationNode | undefined {
  return _world.locations.find((l) => l.id === id);
}

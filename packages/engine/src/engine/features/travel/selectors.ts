import { getLocationById, getWorld } from '@chemicalluck/engine/features/travel/lib/world';
import type { Edge, LocationNode } from '@chemicalluck/engine/features/travel/types';
import { cond, isConditionMet } from '@chemicalluck/engine/lib/conditions';
import type { RootState } from '@chemicalluck/engine/state/store';
import type { Action, ActionGroup, Effect } from '@chemicalluck/engine/types';

export { getLocationById };

export function getTravelLabel(
  current: LocationNode,
  destination: LocationNode,
  edge?: Edge,
) {
  const sameParent = current.parent === destination.parent;
  const isParent = current.id === destination.parent;
  const isChild = destination.id === current.parent;

  if (edge) {
    switch (edge.kind) {
      case 'walk':
        return `👣 Walk to ${destination.name}`;
      case 'bus':
        return `🚌 Take the bus to ${destination.name}`;
      case 'train':
        return `🚆 Take the train to ${destination.name}`;
      case 'drive':
        return `🚗 Drive to ${destination.name}`;
      default:
        return `🗺️ Travel to ${destination.name}`;
    }
  }

  if (current.kind === 'exterior' && destination.kind === 'interior')
    return `🚪 Enter ${destination.name}`;
  if (current.kind === 'interior' && destination.kind === 'exterior')
    return `🚪 Leave ${current.name}`;
  if (isParent) return `🚪 Enter ${destination.name}`;
  if (isChild) return `🚪 Leave ${current.name}`;
  if (sameParent) return `👣 Go to ${destination.name}`;

  return `Go to ${destination.name}`;
}

export function createTravelAction(
  from: LocationNode,
  to: LocationNode,
  extraEffects: Effect[] = [],
  edge?: Edge,
): Action {
  const timeEffect: Effect = {
    kind: 'time',
    minutes: edge?.weight ?? 2,
  };
  const moneyEffect: Effect | undefined = edge?.cost
    ? { kind: 'money', amount: -edge.cost }
    : undefined;

  const effects: Effect[] = [
    { kind: 'travel', newLocationId: to.id },
    timeEffect,
    ...(moneyEffect ? [moneyEffect] : []),
    ...extraEffects,
  ];

  return {
    kind: 'action',
    text: getTravelLabel(from, to, edge),
    effects,
    condition: cond.and(to.condition, edge?.condition),
    eventIds: edge?.eventIds,
  };
}

export function currentLocationActions(
  currentId: string,
  state: RootState,
): ActionGroup[] {
  const current = getLocationById(currentId);
  if (!current) return [];
  return (current.actions ?? [])
    .map((group) => ({
      pretext: group.pretext,
      actions: group.actions.filter((a) => isConditionMet(state, a.condition)),
    }))
    .filter((group) => group.actions.length > 0);
}

export function adjacentTravelActions(
  currentId: string,
  state: RootState,
): ActionGroup[] {
  const current = getLocationById(currentId);
  if (!current) return [];

  return getWorld()
    .locations.filter(
      (location) =>
        location.id !== current.id && location.parent === current.id,
    )
    .filter((location) => isConditionMet(state, location.condition))
    .map((location) => ({
      pretext: location.entryText,
      actions: [createTravelAction(current, location)],
    }));
}

export function parentTravelActions(currentId: string): ActionGroup[] {
  const current = getLocationById(currentId);
  if (!current) return [];
  const parent = getLocationById(current.parent);
  if (!parent) return [];

  return [{ actions: [createTravelAction(current, parent)] }];
}

export function edgeTravelActions(
  currentId: string,
  state: RootState,
): ActionGroup[] {
  const current = getLocationById(currentId);
  if (!current) return [];

  return getWorld().edges.flatMap((edge) => {
    if (!edge.nodes.includes(current.id)) return [];

    const destinationId = edge.nodes.find((nodeId) => nodeId !== current.id);
    if (!destinationId) return [];

    const dest = getLocationById(destinationId);
    if (!dest) return [];

    if (
      !isConditionMet(state, dest.condition) ||
      !isConditionMet(state, edge.condition)
    )
      return [];

    return [{ actions: [createTravelAction(current, dest, [], edge)] }];
  });
}

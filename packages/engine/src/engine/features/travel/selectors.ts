import {
  getLocationById,
  getWorld,
} from '@chemicalluck/sim-engine/features/travel/lib/world';
import type {
  Edge,
  LocationNode,
} from '@chemicalluck/sim-engine/features/travel/types';
import { cond, isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type {
  Action,
  ActionGroup,
  Effect,
} from '@chemicalluck/sim-engine/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

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

/**
 * Decide how a travel option whose gates may fail is shown. Each gate is a
 * `{ condition, lockedText }` pair (the destination, and the edge if any).
 * Returns `'open'` when every condition passes, the locked reason when every
 * failing gate carries a `lockedText` (joined if several fail), or `null` to
 * hide the option.
 */
function travelAccess(
  state: RootState,
  gates: ({ condition?: Condition; lockedText?: string } | undefined)[],
): 'open' | { lockedText: string } | null {
  const failing = gates.filter(
    (g): g is NonNullable<typeof g> =>
      !!g && !isConditionMet(state, g.condition),
  );
  if (failing.length === 0) return 'open';
  if (failing.some((g) => !g.lockedText)) return null;
  return { lockedText: failing.map((g) => g.lockedText).join('; ') };
}

function gatedTravelAction(
  state: RootState,
  from: LocationNode,
  to: LocationNode,
  edge?: Edge,
): Action | null {
  const access = travelAccess(state, [to, edge]);
  if (!access) return null;
  const action = createTravelAction(from, to, [], edge);
  return access === 'open' ? action : { ...action, ...access };
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
    .flatMap((location) => {
      const action = gatedTravelAction(state, current, location);
      return action ? [{ pretext: location.entryText, actions: [action] }] : [];
    });
}

/**
 * Travel back to the parent location. The parent's condition applies the same
 * way as for children: locked with its `lockedText`, otherwise hidden. Without
 * `state` the condition is left to the action list to evaluate (hidden when
 * unmet).
 */
export function parentTravelActions(
  currentId: string,
  state?: RootState,
): ActionGroup[] {
  const current = getLocationById(currentId);
  if (!current) return [];
  const parent = getLocationById(current.parent);
  if (!parent) return [];

  if (!state) return [{ actions: [createTravelAction(current, parent)] }];
  const action = gatedTravelAction(state, current, parent);
  return action ? [{ actions: [action] }] : [];
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

    const action = gatedTravelAction(state, current, dest, edge);
    return action ? [{ actions: [action] }] : [];
  });
}

/**
 * Render each travel action's `lockedText` through `render` (the linguistics
 * `renderText` with a template context), so locked reasons can use template
 * variables such as `{hour}` like location descriptions do.
 */
export function renderTravelLockedText(
  groups: ActionGroup[],
  render: (template: string) => string,
): ActionGroup[] {
  return groups.map((group) => ({
    ...group,
    actions: group.actions.map((action) =>
      action.lockedText
        ? { ...action, lockedText: render(action.lockedText) }
        : action,
    ),
  }));
}

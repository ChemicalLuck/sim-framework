import { afterEach, describe, expect, it } from 'vitest';

import { buildTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/lib/context';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { configureWorld } from '@chemicalluck/sim-engine/features/travel/lib/world';
import type {
  Edge,
  LocationNode,
} from '@chemicalluck/sim-engine/features/travel/types';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import type { RootState } from '@chemicalluck/sim-engine/state/store';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import {
  adjacentTravelActions,
  edgeTravelActions,
  parentTravelActions,
  renderTravelLockedText,
} from './selectors';

const state = {} as RootState;

const closed: Condition = {
  kind: 'eq',
  lhs: { kind: 'const', value: 1 },
  rhs: { kind: 'const', value: 0 },
};

const open: Condition = {
  kind: 'eq',
  lhs: { kind: 'const', value: 1 },
  rhs: { kind: 'const', value: 1 },
};

function world(locations: LocationNode[], edges: Edge[] = []) {
  configureWorld({ locations, edges });
}

const street: LocationNode = { id: 'street', name: 'Street', kind: 'exterior' };

afterEach(() => {
  configureWorld({ locations: [], edges: [] });
});

describe('adjacentTravelActions', () => {
  it('emits a locked travel action when the condition fails and lockedText is set', () => {
    world([
      street,
      {
        id: 'shop',
        name: 'Shop',
        kind: 'interior',
        parent: 'street',
        condition: closed,
        lockedText: 'Open 9:00–17:00',
      },
    ]);
    const groups = adjacentTravelActions('street', state);
    expect(groups).toHaveLength(1);
    const action = groups[0].actions[0];
    expect(action.lockedText).toBe('Open 9:00–17:00');
    expect(isConditionMet(state, action.condition)).toBe(false);
  });

  it('hides a destination whose condition fails without lockedText', () => {
    world([
      street,
      {
        id: 'shop',
        name: 'Shop',
        kind: 'interior',
        parent: 'street',
        condition: closed,
      },
    ]);
    expect(adjacentTravelActions('street', state)).toEqual([]);
  });

  it('emits an enabled action when the condition passes', () => {
    world([
      street,
      {
        id: 'shop',
        name: 'Shop',
        kind: 'interior',
        parent: 'street',
        condition: open,
        lockedText: 'Closed',
      },
    ]);
    const action = adjacentTravelActions('street', state)[0].actions[0];
    expect(isConditionMet(state, action.condition)).toBe(true);
  });
});

describe('parentTravelActions', () => {
  it('always offers the parent when it has no condition', () => {
    world([
      street,
      { id: 'shop', name: 'Shop', kind: 'interior', parent: 'street' },
    ]);
    expect(parentTravelActions('shop', state)).toHaveLength(1);
  });

  it('hides the parent when its condition fails without lockedText', () => {
    world([
      { ...street, condition: closed },
      { id: 'shop', name: 'Shop', kind: 'interior', parent: 'street' },
    ]);
    expect(parentTravelActions('shop', state)).toEqual([]);
  });

  it('locks the parent with its lockedText when its condition fails', () => {
    world([
      { ...street, condition: closed, lockedText: 'Flooded' },
      { id: 'shop', name: 'Shop', kind: 'interior', parent: 'street' },
    ]);
    const groups = parentTravelActions('shop', state);
    expect(groups[0].actions[0].lockedText).toBe('Flooded');
  });
});

describe('edgeTravelActions', () => {
  const park: LocationNode = { id: 'park', name: 'Park', kind: 'exterior' };
  const busEdge: Edge = {
    nodes: ['street', 'park'],
    weight: 10,
    kind: 'bus',
  };

  it('locks an edge whose condition fails using the edge lockedText', () => {
    world(
      [street, park],
      [{ ...busEdge, condition: closed, lockedText: 'Buses run 6–23' }],
    );
    const groups = edgeTravelActions('street', state);
    expect(groups).toHaveLength(1);
    const action = groups[0].actions[0];
    expect(action.lockedText).toBe('Buses run 6–23');
    expect(isConditionMet(state, action.condition)).toBe(false);
  });

  it('hides an edge whose condition fails without lockedText', () => {
    world([street, park], [{ ...busEdge, condition: closed }]);
    expect(edgeTravelActions('street', state)).toEqual([]);
  });

  it('locks with the destination lockedText when the destination fails', () => {
    world(
      [street, { ...park, condition: closed, lockedText: 'Park closed' }],
      [busEdge],
    );
    const action = edgeTravelActions('street', state)[0].actions[0];
    expect(action.lockedText).toBe('Park closed');
  });

  it('hides when any failing part lacks lockedText', () => {
    world(
      [street, { ...park, condition: closed }],
      [{ ...busEdge, condition: closed, lockedText: 'Buses run 6–23' }],
    );
    expect(edgeTravelActions('street', state)).toEqual([]);
  });

  it('does not attach lockedText when everything passes', () => {
    world(
      [street, park],
      [{ ...busEdge, condition: open, lockedText: 'Buses run 6–23' }],
    );
    const action = edgeTravelActions('street', state)[0].actions[0];
    expect(isConditionMet(state, action.condition)).toBe(true);
  });
});

describe('renderTravelLockedText', () => {
  it('renders lockedText templates and leaves other actions untouched', () => {
    world([
      street,
      {
        id: 'shop',
        name: 'Shop',
        kind: 'interior',
        parent: 'street',
        condition: closed,
        lockedText: 'Closed, it is {hour}:00',
      },
      { id: 'cafe', name: 'Cafe', kind: 'interior', parent: 'street' },
    ]);
    const ctx = buildTemplateContext({ narrativeVars: { hour: 22 } });
    const rendered = renderTravelLockedText(
      adjacentTravelActions('street', state),
      (t) => renderText(t, ctx),
    );
    expect(rendered[0].actions[0].lockedText).toBe('Closed, it is 22:00');
    expect(rendered[1].actions[0].lockedText).toBeUndefined();
  });
});

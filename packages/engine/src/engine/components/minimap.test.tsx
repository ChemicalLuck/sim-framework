import { act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  type MinimapConfig,
  configureMinimap,
} from '@chemicalluck/sim-engine/features/minimap/lib/minimap';
import { configureWorld } from '@chemicalluck/sim-engine/features/travel/lib/world';
import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';
import { renderWithStore } from '@chemicalluck/sim-engine/test-utils/render';

import { Minimap } from './minimap';

interface MoveAction {
  type: string;
  locationId?: string;
}

function playerReducer(start: string) {
  return (
    state = { present: { player: { locationId: start } } },
    action: MoveAction,
  ) =>
    action.type === 'move' && action.locationId
      ? { present: { player: { locationId: action.locationId } } }
      : state;
}

const locations: LocationNode[] = [
  { id: 'home', name: 'Home', kind: 'exterior' },
  { id: 'street', name: 'Street', kind: 'exterior' },
  { id: 'kitchen', name: 'Kitchen', kind: 'interior', parent: 'home' },
  { id: 'harbour', name: 'Harbour', kind: 'exterior' },
  { id: 'pier', name: 'Pier', kind: 'exterior' },
];

function mapLabels(container: HTMLElement): string[] {
  return [
    ...container.querySelectorAll('svg[aria-label="World map"] text'),
  ].map((t) => t.textContent);
}

afterEach(() => {
  configureWorld({ locations: [], edges: [] });
  configureMinimap({ nodes: {}, zones: [] });
});

describe('Minimap', () => {
  it('renders a legacy single-map minimap.json', () => {
    configureWorld({
      locations,
      edges: [{ nodes: ['home', 'street'], weight: 5, kind: 'walk' }],
    });
    configureMinimap({
      nodes: {
        home: { x: 40, y: 60, label: 'Home' },
        street: { x: 130, y: 60, label: 'Street' },
      },
      zones: [{ label: 'TOWN', x: 0, y: 0, width: 200, height: 100 }],
    });
    const { container } = renderWithStore(<Minimap />, {
      reducer: playerReducer('kitchen'),
    });
    expect(mapLabels(container)).toEqual(['TOWN', 'Home', 'Street']);
    const svg = container.querySelector('svg[aria-label="World map"]');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 640 200');
    expect(svg?.querySelectorAll('line')).toHaveLength(1);
  });

  it('skips edges whose endpoints are not on the map instead of crashing', () => {
    configureWorld({
      locations,
      edges: [
        { nodes: ['home', 'street'], weight: 5, kind: 'walk' },
        { nodes: ['home', 'nowhere'], weight: 5, kind: 'walk' },
        { nodes: ['harbour', 'street'], weight: 5, kind: 'bus' },
      ],
    });
    configureMinimap({
      nodes: {
        home: { x: 40, y: 60, label: 'Home' },
        street: { x: 130, y: 60, label: 'Street' },
      },
      zones: [],
    });
    const { container } = renderWithStore(<Minimap />, {
      reducer: playerReducer('home'),
    });
    const mapLines = container.querySelectorAll(
      'svg[aria-label="World map"] line',
    );
    expect(mapLines).toHaveLength(1);
  });

  it('shows the map containing the player and switches when travelling between regions', () => {
    configureWorld({
      locations,
      edges: [
        { nodes: ['home', 'street'], weight: 5, kind: 'walk' },
        { nodes: ['street', 'harbour'], weight: 30, kind: 'train' },
        { nodes: ['harbour', 'pier'], weight: 5, kind: 'walk' },
      ],
    });
    const config: MinimapConfig = {
      maps: {
        town: {
          nodes: {
            home: { x: 40, y: 60, label: 'Home' },
            street: { x: 130, y: 60, label: 'Street' },
          },
        },
        coast: {
          nodes: {
            harbour: { x: 20, y: 20, label: 'Harbour' },
            pier: { x: 80, y: 20, label: 'Pier' },
          },
          zones: [{ label: 'DOCKS', x: 0, y: 0, width: 100, height: 50 }],
          viewBox: '0 0 100 50',
        },
      },
    };
    configureMinimap(config);
    const { container, store } = renderWithStore(<Minimap />, {
      reducer: playerReducer('kitchen'),
    });
    const svg = () => container.querySelector('svg[aria-label="World map"]');

    expect(mapLabels(container)).toEqual(['Home', 'Street']);
    expect(svg()?.getAttribute('viewBox')).toBe('0 0 640 200');

    act(() => {
      store.dispatch({ type: 'move', locationId: 'pier' });
    });

    expect(mapLabels(container)).toEqual(['DOCKS', 'Harbour', 'Pier']);
    expect(svg()?.getAttribute('viewBox')).toBe('0 0 100 50');
    // Only the harbour–pier edge lies within the coast map.
    expect(svg()?.querySelectorAll('line')).toHaveLength(1);
  });
});

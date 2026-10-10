import { describe, expect, it } from 'vitest';

import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';

import {
  DEFAULT_MINIMAP_VIEWBOX,
  type MinimapConfig,
  getMinimapMaps,
  resolveMinimapView,
} from './minimap';

const locations: LocationNode[] = [
  { id: 'home', name: 'Home', kind: 'exterior' },
  { id: 'kitchen', name: 'Kitchen', kind: 'interior', parent: 'home' },
  { id: 'harbour', name: 'Harbour', kind: 'exterior' },
  { id: 'ferry', name: 'Ferry', kind: 'interior' },
];
const find = (id: string) => locations.find((l) => l.id === id);

const node = (label: string) => ({ x: 0, y: 0, label });

describe('getMinimapMaps', () => {
  it('treats a legacy top-level nodes/zones config as one default map', () => {
    const maps = getMinimapMaps({ nodes: { home: node('Home') }, zones: [] });
    expect(Object.keys(maps)).toEqual(['default']);
    expect(maps.default.nodes.home.label).toBe('Home');
  });

  it('returns no maps for an empty legacy config', () => {
    expect(getMinimapMaps({ nodes: {}, zones: [] })).toEqual({});
  });
});

describe('resolveMinimapView', () => {
  const config: MinimapConfig = {
    maps: {
      town: { nodes: { home: node('Home') } },
      coast: { nodes: { harbour: node('Harbour') }, viewBox: '0 0 10 10' },
    },
    locationMaps: { ferry: 'coast' },
  };

  it('picks the map holding the nearest ancestor and marks it active', () => {
    const view = resolveMinimapView('kitchen', config, find);
    expect(view?.mapId).toBe('town');
    expect(view?.activeId).toBe('home');
    expect(view?.viewBox).toBe(DEFAULT_MINIMAP_VIEWBOX);
  });

  it('switches maps by region', () => {
    const view = resolveMinimapView('harbour', config, find);
    expect(view?.mapId).toBe('coast');
    expect(view?.activeId).toBe('harbour');
    expect(view?.viewBox).toBe('0 0 10 10');
  });

  it('uses an explicit locationMaps assignment for off-map locations', () => {
    const view = resolveMinimapView('ferry', config, find);
    expect(view?.mapId).toBe('coast');
    expect(view?.activeId).toBeUndefined();
  });

  it('falls back to the first map when the location is on none', () => {
    const view = resolveMinimapView('nowhere', config, find);
    expect(view?.mapId).toBe('town');
    expect(view?.activeId).toBeUndefined();
  });

  it('returns undefined when there are no maps', () => {
    expect(
      resolveMinimapView('home', { nodes: {}, zones: [] }, find),
    ).toBeUndefined();
  });
});

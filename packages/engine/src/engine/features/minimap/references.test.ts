import { describe, expect, it } from 'vitest';

import type { MinimapConfig } from './lib/minimap';
import { referenceProviders, referenceRewriters } from './references';

const node = { x: 0, y: 0, label: 'X' };

describe('minimap references', () => {
  it('collects location ids from legacy nodes, every map and locationMaps', () => {
    const data: MinimapConfig = {
      nodes: { home: node },
      maps: { coast: { nodes: { harbour: node } } },
      locationMaps: { ferry: 'coast' },
    };
    const ids = (referenceProviders[0]?.collect(data, () => []) ?? []).map(
      (r) => r.id,
    );
    expect(ids.sort()).toEqual(['ferry', 'harbour', 'home']);
  });

  it('renames a location in every map and in locationMaps', () => {
    const data: MinimapConfig = {
      maps: {
        town: { nodes: { home: node, street: node } },
        coast: { nodes: { harbour: node } },
      },
      locationMaps: { harbour: 'coast' },
    };
    const count = referenceRewriters[0]?.rewrite(
      data,
      () => false,
      'location',
      'harbour',
      'port',
    );
    expect(count).toBe(2);
    expect(Object.keys(data.maps?.coast.nodes ?? {})).toEqual(['port']);
    expect(data.locationMaps).toEqual({ port: 'coast' });
    expect(Object.keys(data.maps?.town.nodes ?? {})).toEqual([
      'home',
      'street',
    ]);
  });
});

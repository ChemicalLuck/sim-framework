import type {
  ReferenceProvider,
  ReferenceRewriter,
} from '@chemicalluck/sim-engine/lib/validation';

import type { MinimapConfig } from './lib/minimap';

/** Every record in `minimap.json` keyed by location id. */
function locationRecords(config: MinimapConfig): Record<string, unknown>[] {
  return [
    ...(config.nodes ? [config.nodes] : []),
    ...Object.values(config.maps ?? {}).map((m) => m.nodes),
    ...(config.locationMaps ? [config.locationMaps] : []),
  ];
}

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'minimap',
    section: 'world',
    collect: (data) => {
      const ids = new Set(
        locationRecords(data as MinimapConfig).flatMap((r) => Object.keys(r)),
      );
      return [...ids].map((id) => ({
        namespace: 'location',
        id,
        source: 'minimap',
        section: 'world',
      }));
    },
  },
];

/** Rebuild `record` preserving insertion order, swapping the renamed key in place. */
function renameKey<T>(
  record: Record<string, T>,
  oldId: string,
  newId: string,
): Record<string, T> {
  const rebuilt: Record<string, T> = {};
  for (const [key, value] of Object.entries(record)) {
    rebuilt[key === oldId ? newId : key] = value;
  }
  return rebuilt;
}

export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'minimap',
    rewrite: (data, _rewriteNode, ns, oldId, newId) => {
      if (ns !== 'location' || oldId === newId) return 0;
      const config = data as MinimapConfig;
      let count = 0;
      if (config.nodes && oldId in config.nodes) {
        config.nodes = renameKey(config.nodes, oldId, newId);
        count++;
      }
      for (const map of Object.values(config.maps ?? {})) {
        if (oldId in map.nodes) {
          map.nodes = renameKey(map.nodes, oldId, newId);
          count++;
        }
      }
      if (config.locationMaps && oldId in config.locationMaps) {
        config.locationMaps = renameKey(config.locationMaps, oldId, newId);
        count++;
      }
      return count;
    },
  },
];

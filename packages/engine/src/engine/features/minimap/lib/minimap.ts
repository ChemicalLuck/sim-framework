import type { LocationNode } from '@chemicalluck/sim-engine/features/travel/types';

export interface MinimapNode {
  x: number;
  y: number;
  label: string;
}

export interface MinimapZone {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One map: positioned location nodes, optional zones and SVG viewBox. */
export interface MinimapMap {
  nodes: Record<string, MinimapNode>;
  zones?: MinimapZone[];
  /** SVG viewBox, e.g. `"0 0 640 200"` (the default). */
  viewBox?: string;
}

/**
 * Contents of `minimap.json`. Either a single map (top-level `nodes`/`zones`/
 * `viewBox`, the original format) or several under `maps`. The minimap shows
 * the map holding the player's nearest mapped ancestor location; `locationMaps`
 * pins a location (and its descendants) to a map explicitly.
 */
export interface MinimapConfig {
  nodes?: Record<string, MinimapNode>;
  zones?: MinimapZone[];
  viewBox?: string;
  maps?: Record<string, MinimapMap>;
  /** Location id → map id, for locations not placed as a node on any map. */
  locationMaps?: Record<string, string>;
}

export const DEFAULT_MINIMAP_VIEWBOX = '0 0 640 200';

/** Map id used for a legacy single-map config. */
export const DEFAULT_MINIMAP_ID = 'default';

let _config: MinimapConfig = { nodes: {}, zones: [] };

export function configureMinimap(config: MinimapConfig) {
  _config = config;
}

export function getMinimapConfig(): MinimapConfig {
  return _config;
}

/**
 * All maps in `config`, keyed by id. A legacy top-level `nodes`/`zones` map is
 * included as `default` (first) when it has any content.
 */
export function getMinimapMaps(
  config: MinimapConfig,
): Record<string, MinimapMap> {
  const maps: Record<string, MinimapMap> = {};
  const { nodes, zones, viewBox } = config;
  if (Object.keys(nodes ?? {}).length > 0 || (zones?.length ?? 0) > 0) {
    maps[DEFAULT_MINIMAP_ID] = { nodes: nodes ?? {}, zones, viewBox };
  }
  return { ...maps, ...config.maps };
}

export interface MinimapView {
  mapId: string;
  nodes: Record<string, MinimapNode>;
  zones: MinimapZone[];
  viewBox: string;
  /** The highlighted node: the player's nearest ancestor placed on this map. */
  activeId?: string;
}

/**
 * Pick the map to show for `locationId`. Walks the location's ancestor chain
 * (itself first); the first ancestor that is a node on some map, or that has
 * an explicit `locationMaps` entry, selects the map. Falls back to the first
 * map when none match, and returns `undefined` when there are no maps.
 */
export function resolveMinimapView(
  locationId: string,
  config: MinimapConfig,
  findLocation: (id: string) => LocationNode | undefined,
): MinimapView | undefined {
  const maps = getMinimapMaps(config);
  const mapIds = Object.keys(maps);
  if (mapIds.length === 0) return undefined;

  const chain: string[] = [];
  const seen = new Set<string>();
  let current = findLocation(locationId);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.push(current.id);
    current = current.parent ? findLocation(current.parent) : undefined;
  }

  let mapId: string | undefined;
  for (const id of chain) {
    const pinned = config.locationMaps?.[id];
    if (pinned && pinned in maps) {
      mapId = pinned;
      break;
    }
    const containing = mapIds.find((m) => id in maps[m].nodes);
    if (containing) {
      mapId = containing;
      break;
    }
  }
  mapId ??= mapIds[0] ?? DEFAULT_MINIMAP_ID;

  const map = maps[mapId] ?? { nodes: {} };
  return {
    mapId,
    nodes: map.nodes,
    zones: map.zones ?? [],
    viewBox: map.viewBox ?? DEFAULT_MINIMAP_VIEWBOX,
    activeId: chain.find((id) => id in map.nodes),
  };
}

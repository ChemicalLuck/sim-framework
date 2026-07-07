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

export interface MinimapConfig {
  nodes: Record<string, MinimapNode>;
  zones: MinimapZone[];
}

let _config: MinimapConfig = { nodes: {}, zones: [] };

export function configureMinimap(config: MinimapConfig) {
  _config = config;
}

export function getMinimapConfig(): MinimapConfig {
  return _config;
}

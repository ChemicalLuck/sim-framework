import type { Effect } from './effect.types';
import type { NpcSelection } from './npc-filter.types';
import type { Scene } from './scene.types';

interface ScriptBase {
  increment?: number;
  order: 'sequential' | 'random';
  scenes: Scene[];
  completionEffects?: Effect[];
  hideProgress?: boolean;
  npcSelection?: NpcSelection;
}

export type Script =
  | (ScriptBase & { duration: number; endTime?: never })
  | (ScriptBase & { endTime: number; duration?: never });

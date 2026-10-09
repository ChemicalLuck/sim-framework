import type { Effect } from './effect.types';
import type { NpcSelection } from './npc-filter.types';
import type { Scene } from './scene.types';

/** Lets the player end a script before its last scene. */
export interface ScriptLeave<E = Effect> {
  /** Text of the leave action shown on every scene (default "Leave"). */
  text?: string;
  /** Effects applied when leaving early. */
  effects?: E[];
  /**
   * Also apply `completionEffects`, with each numeric `delta`/`amount` scaled by the
   * fraction of scenes completed (e.g. pay for half a shift).
   */
  scaleCompletionEffects?: boolean;
}

interface ScriptBase {
  increment?: number;
  order: 'sequential' | 'random';
  scenes: Scene[];
  completionEffects?: Effect[];
  leave?: ScriptLeave;
  hideProgress?: boolean;
  npcSelection?: NpcSelection;
}

export type Script =
  | (ScriptBase & { duration: number; endTime?: never })
  | (ScriptBase & { endTime: number; duration?: never });

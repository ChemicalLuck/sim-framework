import type { Condition } from './condition.types';
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

/** How a script ends when its `endCondition` is met. */
export type ScriptEndWith = 'completion' | 'leave';

interface ScriptBase {
  increment?: number;
  order: 'sequential' | 'random';
  scenes: Scene[];
  completionEffects?: Effect[];
  leave?: ScriptLeave;
  hideProgress?: boolean;
  npcSelection?: NpcSelection;
  /**
   * Checked after each beat; when met the script ends there instead of moving
   * to its next scene.
   */
  endCondition?: Condition;
  /**
   * Effects run when `endCondition` ends the script: `'completion'` (default)
   * runs `completionEffects`; `'leave'` runs the leave effects, as the Leave
   * button would after the same number of scenes.
   */
  endWith?: ScriptEndWith;
}

export type Script =
  | (ScriptBase & { duration: number; endTime?: never })
  | (ScriptBase & { endTime: number; duration?: never });

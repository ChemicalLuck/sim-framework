import type { Condition } from './condition.types';
import type { Effect } from './effect.types';

export interface Action {
  kind: 'action';
  text: string;
  effects?: Effect[];
  condition?: Condition;
  /**
   * Shown when `condition` isn't met: the action is rendered disabled with this
   * text (e.g. "Requires Charm 3") instead of being hidden.
   */
  lockedText?: string;
  eventIds?: string[];
}

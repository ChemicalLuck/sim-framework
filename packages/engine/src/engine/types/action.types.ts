import type { Condition } from './condition.types';
import type { Effect } from './effect.types';

export interface Action {
  kind: 'action';
  text: string;
  effects?: Effect[];
  condition?: Condition;
  eventIds?: string[];
}

import type { Condition } from '@sim/engine/types/condition.types';
import type { Script } from '@sim/engine/types/script.types';

export interface RandomEvent {
  id: string;
  probability: number;
  script: Script;
  cancels?: boolean;
  condition?: Condition;
}

import type { Condition } from '@chemicalluck/engine/types/condition.types';
import type { Script } from '@chemicalluck/engine/types/script.types';

export interface RandomEvent {
  id: string;
  probability: number;
  script: Script;
  cancels?: boolean;
  condition?: Condition;
}

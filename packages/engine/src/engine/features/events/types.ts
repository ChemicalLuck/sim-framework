import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { Script } from '@chemicalluck/sim-engine/types/script.types';

export interface RandomEvent {
  id: string;
  probability: number;
  script: Script;
  cancels?: boolean;
  condition?: Condition;
}

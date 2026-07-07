import type { Condition } from '@chemicalluck/engine/types/condition.types';

export interface JsonRandomEvent {
  id: string;
  probability: number;
  scriptId: string;
  cancels?: boolean;
  condition?: Condition;
}

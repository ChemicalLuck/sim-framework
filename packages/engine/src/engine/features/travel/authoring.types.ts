import type { JsonAction, JsonActionGroup } from '@chemicalluck/sim-engine/features/core/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

export type { JsonAction };

export interface JsonLocation {
  id: string;
  name: string;
  kind: 'exterior' | 'interior';
  parent?: string;
  condition?: Condition;
  nearby?: unknown;
  description?: string;
  entryText?: string;
  actions?: JsonActionGroup[];
}

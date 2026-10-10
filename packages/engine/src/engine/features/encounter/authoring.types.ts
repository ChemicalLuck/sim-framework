import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';
import type {
  EncounterActionActor,
  EncounterStopReason,
} from '@chemicalluck/sim-engine/features/encounter/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

export interface JsonViewEncounterEffect {
  kind: 'view';
  activeViewId: 'EncounterView';
  encounterId: string;
  npcId: string;
}

declare module '@chemicalluck/sim-engine/data/authoring.types' {
  interface JsonEffectMap {
    view_encounter: JsonViewEncounterEffect;
  }
}

export interface JsonEncounterAction {
  id: string;
  text: string;
  bodyPart: string;
  effects?: JsonEffect[];
  condition?: Condition;
  activateTransition?: string;
  npcWeight?: number;
  npcSkillWeights?: Record<string, number>;
  npcTraitWeights?: Record<string, number>;
  npcStop?: boolean;
  actor?: EncounterActionActor;
}

export interface JsonEncounterState {
  id: string;
  name: string;
  text: string;
  actions: JsonEncounterAction[];
  condition?: Condition;
  transitionTo?: string;
  stopCondition?: Condition;
}

export interface JsonEncounter {
  id: string;
  name: string;
  states: JsonEncounterState[];
  initialStateId: string;
  npcNeeds?: Record<string, number>;
  npcDoNothingWeight?: number;
  stopEffects?: JsonEffect[];
  stopEffectsByReason?: Partial<Record<EncounterStopReason, JsonEffect[]>>;
  stopCondition?: Condition;
}

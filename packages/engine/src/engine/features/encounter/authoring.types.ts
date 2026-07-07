import type { JsonEffect } from '@sim/engine/features/core/types';
import type { Condition } from '@sim/engine/types/condition.types';

export interface JsonViewEncounterEffect {
  kind: 'view';
  activeViewId: 'EncounterView';
  encounterId: string;
  npcId: string;
}

declare module '@sim/engine/data/authoring.types' {
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
}

export interface JsonEncounterState {
  id: string;
  name: string;
  text: string;
  actions: JsonEncounterAction[];
  condition?: Condition;
  transitionTo?: string;
}

export interface JsonEncounter {
  id: string;
  name: string;
  states: JsonEncounterState[];
  initialStateId: string;
  npcNeeds?: Record<string, number>;
  npcDoNothingWeight?: number;
  stopEffects?: JsonEffect[];
}

import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { BaseEffect, Effect } from '@chemicalluck/sim-engine/types/effect.types';

export interface EncounterAction {
  id: string;
  text: string;
  bodyPart: string;
  effects?: Effect[];
  condition?: Condition;
  /** Force a state transition when the player activates this action. */
  activateTransition?: string;
  /** Base NPC selection weight (default 1). */
  npcWeight?: number;
  /** Per-skill weight multipliers: `{ athletics: 1.5 }` means high athletics NPCs prefer this action. */
  npcSkillWeights?: Record<string, number>;
  /** Per-trait weight multipliers: `{ Extroverted: 1.3 }`. */
  npcTraitWeights?: Record<string, number>;
}

export interface EncounterState {
  id: string;
  name: string;
  /** Narrative paragraph shown while in this state. Supports `{npc0.*}` tokens. */
  text: string;
  actions: EncounterAction[];
  /** When this condition becomes true, automatically transition to `transitionTo`. */
  condition?: Condition;
  transitionTo?: string;
}

export interface Encounter {
  kind: 'encounter';
  id: string;
  name: string;
  states: EncounterState[];
  initialStateId: string;
  /** NPC initial need values for the duration of this encounter. */
  npcNeeds?: Record<string, number>;
  /** Weight for the NPC choosing to do nothing this turn (default 1). */
  npcDoNothingWeight?: number;
  /** Effects fired when the player stops the encounter. */
  stopEffects?: Effect[];
}

export interface EncounterEffect extends BaseEffect<'encounter'> {
  readonly encounterId: string;
  readonly npcId: string;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    encounter: EncounterEffect;
  }
}

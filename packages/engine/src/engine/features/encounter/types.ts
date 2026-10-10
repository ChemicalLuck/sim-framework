import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type {
  BaseEffect,
  Effect,
} from '@chemicalluck/sim-engine/types/effect.types';

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
  /**
   * The NPC leaves by picking this action; when it is the last NPC present the
   * encounter ends (stop reason `npc`). Its effects apply first. Never offered
   * to the player.
   */
  npcStop?: boolean;
  /** Who may take this action (default `both`). `npcStop` actions are NPC-only. */
  actor?: EncounterActionActor;
  /**
   * Who the action is aimed at: `self`, `player` or an NPC slot (0-based).
   * NPC-scoped effects (e.g. `needs` with `target: 'npc'`) apply to the slot's
   * NPC; otherwise to the acting NPC (the first NPC for player actions).
   */
  target?: EncounterActionTarget;
}

export type EncounterActionActor = 'player' | 'npc' | 'both';

export type EncounterActionTarget = 'self' | 'player' | number;

/** Who or what ended an encounter. */
export type EncounterStopReason = 'player' | 'npc' | 'condition';

export interface EncounterState {
  id: string;
  name: string;
  /** Narrative paragraph shown while in this state. Supports `{npc0.*}` tokens. */
  text: string;
  actions: EncounterAction[];
  /** When this condition becomes true, automatically transition to `transitionTo`. */
  condition?: Condition;
  transitionTo?: string;
  /** Ends the encounter (reason `condition`) when met after the NPC's pick. */
  stopCondition?: Condition;
}

export interface Encounter {
  kind: 'encounter';
  id: string;
  name: string;
  states: EncounterState[];
  initialStateId: string;
  /** NPC initial need values for the duration of this encounter. */
  npcNeeds?: Record<string, number>;
  /** Order NPCs pick in each turn, as slot indices (default: slot order). */
  npcTurnOrder?: number[];
  /** Weight for the NPC choosing to do nothing this turn (default 1). */
  npcDoNothingWeight?: number;
  /** Effects fired whenever the encounter stops, whatever the reason. */
  stopEffects?: Effect[];
  /** Extra effects fired after `stopEffects` for one stop reason only. */
  stopEffectsByReason?: Partial<Record<EncounterStopReason, Effect[]>>;
  /** Ends the encounter (reason `condition`) when met after the NPC's pick, in any state. */
  stopCondition?: Condition;
}

export interface EncounterEffect extends BaseEffect<'encounter'> {
  readonly encounterId: string;
  /** The single NPC; alias for `npcIds: [npcId]`. */
  readonly npcId: string;
  /** Participating NPCs in slot order; overrides `npcId` when set. */
  readonly npcIds?: string[];
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    encounter: EncounterEffect;
  }
}

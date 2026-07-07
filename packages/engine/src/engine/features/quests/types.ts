import type { Action } from '@chemicalluck/sim-engine/types/action.types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { BaseEffect, Effect } from '@chemicalluck/sim-engine/types/effect.types';
import type { Scene } from '@chemicalluck/sim-engine/types/scene.types';

export type ObjectiveTrigger = Action | Condition;
export type ObjectiveCondition = Action | Scene | Condition;
export type ObjectiveState = 'locked' | 'available' | 'complete';
export const OBJECTIVE_STATES = [
  'locked',
  'available',
  'complete',
] as const satisfies readonly ObjectiveState[];

export interface QuestObjective {
  state: ObjectiveState;
  name: string;
  trigger?: ObjectiveTrigger;
  condition: ObjectiveCondition;
  onComplete?: Effect[];
}

export interface Quest {
  id: string;
  name: string;
  objectives: QuestObjective[];
}

/** Objective template — `name` and `onComplete` effect strings support {npc0.id}, {npc0.firstName}, {npc0.lastName} interpolation. */
export interface QuestObjectiveTemplate {
  state: ObjectiveState;
  name: string;
  condition: ObjectiveCondition;
  trigger?: ObjectiveTrigger;
  onComplete?: Effect[];
}

/** Quest template — instantiated at runtime into a concrete Quest via a quest_create effect. */
export interface QuestTemplate {
  /** Template identifier, referenced by quest_create effects. */
  id: string;
  /** Produces the runtime quest id; supports {npc0.id}, {npc0.firstName}, {npc0.lastName}. */
  idTemplate: string;
  /** Quest display name; supports {npc0.id}, {npc0.firstName}, {npc0.lastName}. */
  name: string;
  objectives: QuestObjectiveTemplate[];
}

export interface QuestEffect extends BaseEffect<'quest'> {
  readonly questId: string;
  readonly objectiveName: string;
  readonly objectiveState: ObjectiveState;
}

export interface QuestCreateEffect extends BaseEffect<'quest_create'> {
  readonly templateId: string;
  /** NPC whose data is used to instantiate the template. Use "$npc" in conversation topics. */
  readonly npcId: string;
}

declare module '@chemicalluck/sim-engine/types/effect.types' {
  interface EffectMap {
    quest: QuestEffect;
    quest_create: QuestCreateEffect;
  }
}

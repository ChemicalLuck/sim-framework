import type {
  JsonAction,
  JsonEffect,
  JsonScene,
} from '@chemicalluck/sim-engine/features/core/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import type { ObjectiveState } from './types';

/** A scene objective naming a scene in `scenes.json`. */
export interface JsonSceneRef {
  kind: 'scene';
  sceneId: string;
}

export type JsonObjectiveTrigger = JsonAction | Condition;
export type JsonObjectiveCondition =
  | JsonAction
  | JsonScene
  | JsonSceneRef
  | Condition;

export interface JsonQuestObjective {
  state: ObjectiveState;
  name: string;
  trigger?: JsonObjectiveTrigger;
  condition: JsonObjectiveCondition;
  onComplete?: JsonEffect[];
}

/** A quest as authored in `quests.json`. */
export interface JsonQuest {
  id: string;
  name: string;
  objectives: JsonQuestObjective[];
}

/** A quest template as authored in `quest-templates.json`. */
export interface JsonQuestTemplate {
  id: string;
  idTemplate: string;
  name: string;
  objectives: JsonQuestObjective[];
}

import type { UnknownAction } from '@reduxjs/toolkit';
import type { JsonEffectMap } from '@chemicalluck/engine/data/authoring.types';
import type { JsonNpcSelection } from '@chemicalluck/engine/features/npcs/types';
import type { EngineDispatch, RootState } from '@chemicalluck/engine/state/store';
import type { Condition } from '@chemicalluck/engine/types/condition.types';
import type { Effect } from '@chemicalluck/engine/types/effect.types';

export type JsonEffect = JsonEffectMap[keyof JsonEffectMap] | Effect;

export interface JsonAction {
  kind: 'action';
  text: string;
  effects: JsonEffect[];
  condition?: Condition;
  eventIds?: string[];
}

export interface JsonActionGroup {
  pretext?: string;
  actions: JsonAction[];
}

export interface JsonScene {
  kind: 'scene';
  text: string;
  actions: JsonActionGroup[];
  completionEffects?: JsonEffect[];
  npcSelection?: JsonNpcSelection;
}

export interface JsonSceneWithId extends JsonScene {
  id: string;
}

export interface JsonScript {
  id: string;
  order: 'sequential' | 'random';
  duration?: number;
  endTime?: number;
  completionEffects?: JsonEffect[];
  scenes: JsonScene[];
  npcSelection?: JsonNpcSelection;
  hideProgress?: boolean;
}

export interface EffectContext {
  dispatch: EngineDispatch;
  group: string;
  prevState: RootState;
  newState?: RootState;
  /** The full list of effects processed in this batch */
  effects: Effect[];
}

/** Dispatches a Redux action with a undo-group meta tag attached. */
export function dispatchWithGroup(
  dispatch: EngineDispatch,
  action: UnknownAction,
  group: string,
): void {
  dispatch({ ...action, meta: { group } });
}

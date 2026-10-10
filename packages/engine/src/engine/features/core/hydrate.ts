import { effectHydrators } from 'virtual:game-extensions';

import type { Registry } from '@chemicalluck/sim-engine/data/registry';
import type { Scene, Script } from '@chemicalluck/sim-engine/types';
import type { ActionGroup } from '@chemicalluck/sim-engine/types/action-group.types';
import type { Action } from '@chemicalluck/sim-engine/types/action.types';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';
import type {
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import type {
  JsonAction,
  JsonActionGroup,
  JsonEffect,
  JsonScene,
  JsonScript,
} from './types';

export interface HydrationContext {
  items: Registry<Item>;
  wearables: Registry<Wearable>;
  templates: Registry<WearableTemplate>;
  scenes: Registry<Scene>;
  scripts: Registry<Script>;
}

export function hydrateEffect(
  rawEffect: JsonEffect,
  ctx: HydrationContext,
): Effect {
  for (const hydrator of effectHydrators) {
    if (hydrator.test(rawEffect)) return hydrator.hydrate(rawEffect, ctx);
  }
  return rawEffect as Effect;
}

export function hydrateAction(
  action: JsonAction,
  ctx: HydrationContext,
): Action {
  return {
    kind: 'action',
    text: action.text,
    condition: action.condition,
    lockedText: action.lockedText,
    effects: action.effects.map((e) => hydrateEffect(e, ctx)),
    eventIds: action.eventIds,
  };
}

export function hydrateActionGroup(
  group: JsonActionGroup,
  ctx: HydrationContext,
): ActionGroup {
  return {
    pretext: group.pretext,
    actions: group.actions.map((a) => hydrateAction(a, ctx)),
  };
}

export function hydrateScene(
  sceneJson: JsonScene,
  ctx: HydrationContext,
): Scene {
  return {
    kind: 'scene',
    text: sceneJson.text,
    actions: sceneJson.actions.map((g) => hydrateActionGroup(g, ctx)),
    completionEffects: sceneJson.completionEffects?.map((e) =>
      hydrateEffect(e, ctx),
    ),
    npcSelection: sceneJson.npcSelection,
  };
}

export function hydrateScript(
  scriptJson: JsonScript,
  ctx: HydrationContext,
): Script {
  const scenes = scriptJson.scenes.map((s) => hydrateScene(s, ctx));
  const completionEffects = scriptJson.completionEffects?.map((e) =>
    hydrateEffect(e, ctx),
  );
  const leave = scriptJson.leave && {
    ...scriptJson.leave,
    effects: scriptJson.leave.effects?.map((e) => hydrateEffect(e, ctx)),
  };
  const shared = {
    order: scriptJson.order,
    increment: scriptJson.increment,
    scenes,
    completionEffects,
    leave,
    npcSelection: scriptJson.npcSelection,
    hideProgress: scriptJson.hideProgress,
    endCondition: scriptJson.endCondition,
    endWith: scriptJson.endWith,
  };

  if (scriptJson.duration !== undefined) {
    return {
      ...shared,
      duration: scriptJson.duration,
    };
  }
  return {
    ...shared,
    endTime: scriptJson.endTime ?? 0,
  };
}

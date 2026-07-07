import { defineEffectHydrator } from '@chemicalluck/sim-engine/data/effect-hydrators';
import type { JsonEffect } from '@chemicalluck/sim-engine/features/core/types';

import type {
  JsonViewSceneEffect,
  JsonViewScriptEffect,
} from './authoring.types';

const hydrators = [
  defineEffectHydrator(
    (e: JsonEffect): e is JsonViewSceneEffect =>
      e.kind === 'view' && 'sceneId' in e,
    (e, ctx) => ({
      kind: 'view',
      activeViewId: 'SceneView',
      props: { scene: ctx.scenes.get(e.sceneId) },
    }),
  ),
  defineEffectHydrator(
    (e: JsonEffect): e is JsonViewScriptEffect =>
      e.kind === 'view' && 'scriptId' in e,
    (e, ctx) => ({
      kind: 'view',
      activeViewId: 'ScriptView',
      props: { script: ctx.scripts.get(e.scriptId) },
    }),
  ),
];

export default hydrators;

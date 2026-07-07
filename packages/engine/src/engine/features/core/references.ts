import {
  type IdSource,
  type ReferenceProvider,
  type ReferenceRewriter,
  collectActionGroupRefs,
  collectEffectRefs,
  rewriteActionGroupRefs,
  rewriteEffectRefs,
} from '@chemicalluck/sim-engine/lib/validation';
import type { Item, Wearable } from '@chemicalluck/sim-engine/types/item.types';

import type { JsonSceneWithId, JsonScript } from './types';

type ItemEntry = Item | Wearable;

export const idSources: IdSource[] = [
  {
    namespace: 'item',
    file: 'items',
    select: (data) =>
      (data as ItemEntry[]).filter((i) => i.kind === 'item').map((i) => i.id),
  },
  {
    namespace: 'wearable',
    file: 'items',
    select: (data) =>
      (data as ItemEntry[])
        .filter((i) => i.kind === 'wearable')
        .map((i) => i.id),
  },
  {
    namespace: 'wearableTemplate',
    file: 'wearable-templates',
    select: (data) => (data as { id: string }[]).map((t) => t.id),
  },
  {
    namespace: 'scene',
    file: 'scenes',
    select: (data) => (data as JsonSceneWithId[]).map((s) => s.id),
  },
  {
    namespace: 'script',
    file: 'scripts',
    select: (data) => (data as JsonScript[]).map((s) => s.id),
  },
];

export const referenceProviders: ReferenceProvider[] = [
  {
    file: 'scenes',
    section: 'scenes',
    collect: (data, extract) =>
      (data as JsonSceneWithId[]).flatMap((scene) => [
        ...collectActionGroupRefs(
          scene.actions,
          `scene:${scene.id}`,
          'scenes',
          extract,
        ),
        ...collectEffectRefs(
          scene.completionEffects,
          `scene:${scene.id}`,
          'scenes',
          extract,
        ),
      ]),
  },
  {
    file: 'scripts',
    section: 'scripts',
    collect: (data, extract) =>
      (data as JsonScript[]).flatMap((script) => [
        ...collectEffectRefs(
          script.completionEffects,
          `script:${script.id}`,
          'scripts',
          extract,
        ),
        ...script.scenes.flatMap((scene) =>
          collectActionGroupRefs(
            scene.actions,
            `script:${script.id}`,
            'scripts',
            extract,
          ),
        ),
      ]),
  },
  {
    file: 'items',
    section: 'items',
    collect: (data, extract) =>
      (data as ItemEntry[]).flatMap((item) =>
        collectActionGroupRefs(
          item.actions,
          `item:${item.id}`,
          'items',
          extract,
        ),
      ),
  },
];

// Core owns no node-ref kinds itself; these rewriters walk its action-group and
// effect-bearing files and apply the composed node rewriter (every feature's
// node rewriters) plus the shared `eventIds` rewrite.
export const referenceRewriters: ReferenceRewriter[] = [
  {
    file: 'scenes',
    rewrite: (data, rewriteNode, ns, oldId, newId) => {
      let count = 0;
      for (const scene of data as JsonSceneWithId[]) {
        count += rewriteActionGroupRefs(
          scene.actions,
          rewriteNode,
          ns,
          oldId,
          newId,
        );
        count += rewriteEffectRefs(scene.completionEffects, rewriteNode);
      }
      return count;
    },
  },
  {
    file: 'scripts',
    rewrite: (data, rewriteNode, ns, oldId, newId) => {
      let count = 0;
      for (const script of data as JsonScript[]) {
        count += rewriteEffectRefs(script.completionEffects, rewriteNode);
        for (const scene of script.scenes) {
          count += rewriteActionGroupRefs(
            scene.actions,
            rewriteNode,
            ns,
            oldId,
            newId,
          );
        }
      }
      return count;
    },
  },
  {
    file: 'items',
    rewrite: (data, rewriteNode, ns, oldId, newId) =>
      (data as ItemEntry[]).reduce(
        (count, item) =>
          count +
          rewriteActionGroupRefs(item.actions, rewriteNode, ns, oldId, newId),
        0,
      ),
  },
];

import {
  type HydrationContext,
  hydrateScene,
  hydrateScript,
} from '@sim/engine/features/core/hydrate';
import type { JsonSceneWithId, JsonScript } from '@sim/engine/features/core/types';
import type { Scene, Script } from '@sim/engine/types';
import type {
  InventoryItem,
  Item,
  Wearable,
  WearableTemplate,
} from '@sim/engine/types/item.types';

import { Registry, buildRegistry } from './registry';

interface JsonTemplateWithId extends WearableTemplate {
  id: string;
}

/**
 * Map of extension-registered hydrated content, keyed by extension key.
 * Extensions augment this interface to declare their content shape:
 *
 *   declare module '@sim/engine/data' {
 *     interface ContentExtensions {
 *       myExtension: { foo: Foo[] };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContentExtensions {}

/**
 * Runtime registration provided by an extension to participate in `loadContent`.
 * The hydrated value lands at `Content.extensions[key]`.
 */
export interface DataExtension<TJson = unknown, THydrated = unknown> {
  key: keyof ContentExtensions;
  data: TJson;
  hydrate?: (data: TJson, ctx: HydrationContext) => THydrated;
}

/**
 * Pre-scene extension that populates a `HydrationContext` key before
 * scene/script hydration runs. Use this for content that must be resolvable
 * by effect hydrators (e.g. shops → `ctx.shops`).
 */
export interface ContextExtension<
  TJson = unknown,
  K extends keyof HydrationContext = keyof HydrationContext,
> {
  contextKey: K;
  data: TJson;
  hydrate: (data: TJson, ctx: HydrationContext) => HydrationContext[K];
}

export interface RawContent {
  items: InventoryItem[];
  templates: JsonTemplateWithId[];
  scripts: JsonScript[];
  scenes: JsonSceneWithId[];
  contextExtensions?: ContextExtension[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extensions?: DataExtension<any, any>[];
}

export interface Content {
  items: Registry<Item>;
  wearables: Registry<Wearable>;
  templates: Registry<WearableTemplate>;
  scripts: Registry<Script>;
  scenes: Registry<Scene>;
  extensions: ContentExtensions;
}

const empty = <T>(label: string): Registry<T> =>
  buildRegistry<T>(label, [], () => '');

export function loadContent(raw: RawContent): Content {
  const itemList = raw.items.filter((i): i is Item => i.kind === 'item');
  const wearableList = raw.items.filter(
    (i): i is Wearable => i.kind === 'wearable',
  );
  const items = buildRegistry('item', itemList, (i) => i.id);
  const wearables = buildRegistry('wearable', wearableList, (w) => w.id);
  const templates = buildRegistry('template', raw.templates, (t) => t.id);

  // Pass 1: run context extensions to populate HydrationContext before
  // scripts/scenes are hydrated. Features augment HydrationContext and
  // register a ContextExtension to populate their key (e.g. shops).
  const ctx: HydrationContext = {
    items,
    wearables,
    templates,
    scenes: empty<Scene>('scene'),
    scripts: empty<Script>('script'),
  };
  for (const ext of raw.contextExtensions ?? []) {
    (ctx as unknown as Record<string, unknown>)[ext.contextKey] = ext.hydrate(
      ext.data,
      ctx,
    );
  }

  // Pass 2: scripts may reference shops/items but not yet scenes.
  const scriptList = raw.scripts.map((s) => hydrateScript(s, ctx));
  const scripts = new Registry(
    'script',
    new Map(raw.scripts.map((s, i) => [s.id, scriptList[i]])),
  );
  ctx.scripts = scripts;

  // Pass 3: scenes may reference shops/scripts/items.
  const sceneList = raw.scenes.map((s) => hydrateScene(s, ctx));
  const scenes = new Registry(
    'scene',
    new Map(raw.scenes.map((s, i) => [s.id, sceneList[i]])),
  );
  ctx.scenes = scenes;

  // Pass 4: data extensions hydrate with full context (items/wearables/templates/shops/scripts/scenes).
  const extensions: Record<string, unknown> = {};
  for (const ext of raw.extensions ?? []) {
    extensions[ext.key] = ext.hydrate ? ext.hydrate(ext.data, ctx) : ext.data;
  }

  return {
    items,
    wearables,
    templates,
    scripts,
    scenes,
    // Double cast: `extensions` is built as Record<string,unknown> because
    // ContentExtensions is an open interface augmented at declaration time; the
    // runtime shape is guaranteed by each extension's DataExtension registration.
    extensions: extensions as unknown as ContentExtensions,
  };
}

export { Registry, buildRegistry } from './registry';
export type { HydrationContext } from '@sim/engine/features/core/hydrate';

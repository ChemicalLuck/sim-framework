import {
  type HydrationContext,
  hydrateScene,
  hydrateScript,
} from '@chemicalluck/sim-engine/features/core/hydrate';
import type {
  JsonSceneWithId,
  JsonScript,
} from '@chemicalluck/sim-engine/features/core/types';
import type { Scene, Script } from '@chemicalluck/sim-engine/types';
import type {
  InventoryItem,
  Item,
  Wearable,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

import { Registry, buildRegistry } from './registry';

interface JsonTemplateWithId extends WearableTemplate {
  id: string;
}

/**
 * Map of extension-registered hydrated content, keyed by extension key.
 * Extensions augment this interface to declare their content shape:
 *
 *   declare module '@chemicalluck/sim-engine/data' {
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

function placeholderRegistry<T>(
  label: string,
  entries: { id: string }[],
): Registry<T> {
  return new Registry(label, new Map(entries.map((e) => [e.id, {} as T])));
}

/**
 * Hydrated content is stored in game state (view props) and persisted as JSON,
 * so a scene/script that leads back to itself can't be saved. Reject such
 * loops at load time with the ids involved rather than failing on save.
 */
function assertNoCycles(
  rawScenes: { id: string }[],
  scenes: Registry<Scene>,
  rawScripts: { id: string }[],
  scripts: Registry<Script>,
): void {
  const labels = new Map<object, string>();
  for (const { id } of rawScenes) labels.set(scenes.get(id), `scene ${id}`);
  for (const { id } of rawScripts) labels.set(scripts.get(id), `script ${id}`);

  const done = new Set<object>();
  const path: object[] = [];
  const onPath = new Set<object>();
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object' || done.has(node)) return;
    if (onPath.has(node)) {
      const loop = [...path.slice(path.indexOf(node)), node]
        .map((n) => labels.get(n))
        .filter((l) => l !== undefined);
      throw new Error(`Loader: circular reference between ${loop.join(' → ')}`);
    }
    onPath.add(node);
    path.push(node);
    for (const child of Object.values(node)) visit(child);
    path.pop();
    onPath.delete(node);
    done.add(node);
  };
  for (const node of labels.keys()) visit(node);
}

export function loadContent(raw: RawContent): Content {
  const itemList = raw.items.filter((i): i is Item => i.kind === 'item');
  const wearableList = raw.items.filter(
    (i): i is Wearable => i.kind === 'wearable',
  );
  const items = buildRegistry('item', itemList, (i) => i.id);
  const wearables = buildRegistry('wearable', wearableList, (w) => w.id);
  const templates = buildRegistry('template', raw.templates, (t) => t.id);

  // Pass 1: run context extensions to populate HydrationContext before
  // scenes/scripts are hydrated. Features augment HydrationContext and
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

  // Pass 2: scenes and scripts. Scenes and scripts may reference each other
  // (and themselves) in any order, so each id is registered up front as an
  // empty placeholder that effect hydrators resolve to; the hydrated content
  // is then written into it, keeping every reference pointing at the final
  // object.
  const scenes = placeholderRegistry<Scene>('scene', raw.scenes);
  const scripts = placeholderRegistry<Script>('script', raw.scripts);
  ctx.scenes = scenes;
  ctx.scripts = scripts;
  for (const s of raw.scenes)
    Object.assign(scenes.get(s.id), hydrateScene(s, ctx));
  for (const s of raw.scripts) {
    Object.assign(scripts.get(s.id), hydrateScript(s, ctx));
  }
  assertNoCycles(raw.scenes, scenes, raw.scripts, scripts);

  // Pass 3: data extensions hydrate with full context (items/wearables/templates/shops/scripts/scenes).
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
export type { HydrationContext } from '@chemicalluck/sim-engine/features/core/hydrate';

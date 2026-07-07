import { RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { views as gameViews } from 'virtual:game-extensions';
import { content } from 'virtual:game-setup';
import { GameSidebar } from '@sim/engine/components/sidebar';
import { SidebarComponentContext } from '@sim/engine/components/sidebar/context';
import { Button } from '@sim/engine/components/ui/button';
import { SidebarProvider } from '@sim/engine/components/ui/sidebar';
import { ThemeProvider } from '@sim/engine/components/ui/theme-provider';
import { hydrateScene, hydrateScript } from '@sim/engine/features/core/hydrate';
import { hydrateEncounter } from '@sim/engine/features/encounter/hydrate';
import { startEncounter } from '@sim/engine/features/encounter/slice';
import { initConversationTopics } from '@sim/engine/features/npcs/lib/conversation-topics';
import { ViewsContext } from '@sim/engine/features/view/context';
import ViewManager from '@sim/engine/features/view/manager';
import { setView } from '@sim/engine/features/view/slice';
import type { EngineStore } from '@sim/engine/state/store';

import { usePreviewState } from '../mock-state';
import type { PreviewEntity } from '../narrative-preview';
import { MOCK_NPC_ID, createMockNpc } from './mock-npc';
import { createSandboxStore } from './sandbox-store';

// Quests/quest-templates aren't playable views — sim only covers these.
export type SandboxEntity = Exclude<
  PreviewEntity,
  { kind: 'quest' } | { kind: 'questTemplate' }
>;

function entityId(entity: SandboxEntity): string {
  switch (entity.kind) {
    case 'scene':
      return `scene:${(entity.scene as { id?: string }).id ?? ''}`;
    case 'script':
      return `script:${(entity.script as { id?: string }).id ?? ''}`;
    case 'encounter':
      return `encounter:${entity.encounter.id}`;
    case 'event':
      return `event:${entity.event.id}`;
    case 'conversation':
      return `conversation:${entity.topic.id}`;
  }
}

type BuildResult = { store: EngineStore } | { error: string };

// Hydrates the working-set entity against the pre-built content registries and
// seeds a fresh sandbox store with the active view. Side-effects act only on
// the newly created local store (plus the global conversation-topic registry).
function buildSim(
  entity: SandboxEntity,
  seed: ReturnType<typeof usePreviewState>['values'],
): BuildResult {
  try {
    const store = createSandboxStore(seed, createMockNpc());
    switch (entity.kind) {
      case 'scene': {
        const scene = hydrateScene(entity.scene, content);
        store.dispatch(
          setView({
            activeViewId: 'SceneView',
            props: { scene, npcIds: [MOCK_NPC_ID] },
          }),
        );
        break;
      }
      case 'script': {
        const script = hydrateScript(entity.script, content);
        store.dispatch(
          setView({
            activeViewId: 'ScriptView',
            props: { script, npcIds: [MOCK_NPC_ID] },
          }),
        );
        break;
      }
      case 'event': {
        if (!entity.script) {
          throw new Error(`unknown script '${entity.event.scriptId}'`);
        }
        const script = hydrateScript(entity.script, content);
        store.dispatch(
          setView({
            activeViewId: 'ScriptView',
            props: { script, npcIds: [MOCK_NPC_ID] },
          }),
        );
        break;
      }
      case 'encounter': {
        const encounter = hydrateEncounter(entity.encounter, content);
        store.dispatch(startEncounter({ encounter, npcId: MOCK_NPC_ID }));
        store.dispatch(setView({ activeViewId: 'EncounterView', props: {} }));
        break;
      }
      case 'conversation': {
        initConversationTopics([entity.topic]);
        store.dispatch(
          setView({
            activeViewId: 'ConversationView',
            props: { npcId: MOCK_NPC_ID },
          }),
        );
        break;
      }
    }
    return { store };
  } catch (e) {
    return { error: String(e) };
  }
}

export function SandboxView(entity: SandboxEntity) {
  const { values } = usePreviewState();
  const [resetKey, setResetKey] = useState(0);
  const eid = entityId(entity);

  const built = useMemo(
    () => buildSim(entity, values),
    // Rebuild on entity switch or explicit reset — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eid, resetKey],
  );

  if ('error' in built) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-red-400">Cannot simulate: {built.error}</p>
        <p className="text-zinc-500">
          Fix the broken reference (or switch to Read-only) and retry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setResetKey((k) => k + 1);
          }}
        >
          <RotateCcw size={13} /> Reset
        </Button>
      </div>
      <div className="relative h-[28rem] overflow-auto rounded border border-zinc-700">
        <Provider store={built.store}>
          <ThemeProvider>
            <SidebarProvider>
              <SidebarComponentContext value={GameSidebar}>
                <ViewsContext value={gameViews}>
                  <ViewManager />
                </ViewsContext>
              </SidebarComponentContext>
            </SidebarProvider>
          </ThemeProvider>
        </Provider>
      </div>
    </div>
  );
}

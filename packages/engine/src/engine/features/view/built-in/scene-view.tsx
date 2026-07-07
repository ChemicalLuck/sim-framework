import { ActionButtonList } from '@chemicalluck/engine/components/action-button-list';
import { ItemActionsButtonsList } from '@chemicalluck/engine/components/item-actions-button-list';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import { renderText } from '@chemicalluck/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/engine/features/linguistics/use-template-context';
import { selectNpcsByIds } from '@chemicalluck/engine/features/npcs/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';
import type { Scene } from '@chemicalluck/engine/types';

interface SceneViewProps {
  scene: Scene;
  npcIds?: string[];
}

const EMPTY_NPC_IDS: string[] = [];

function SceneView({ scene, npcIds = EMPTY_NPC_IDS }: SceneViewProps) {
  const npcs = useEngineSelector(selectNpcsByIds(npcIds));
  const ctx = useTemplateContext(npcs);
  const resolve = (text: string) => renderText(text, ctx);

  const resolvedGroups = scene.actions.map((group) => ({
    pretext: group.pretext ? resolve(group.pretext) : group.pretext,
    actions: group.actions.map((a) => ({ ...a, text: resolve(a.text) })),
  }));

  return (
    <WithSidebar>
      <p className="mb-6">{resolve(scene.text)}</p>
      {resolvedGroups.map((group, i) => (
        // eslint-disable-next-line react-x/no-array-index-key
        <div key={i} className="flex flex-col gap-1">
          {group.pretext && <p>{group.pretext}</p>}
          <ActionButtonList
            actions={group.actions}
            defaultEffects={scene.completionEffects}
          />
        </div>
      ))}
      <ItemActionsButtonsList />
    </WithSidebar>
  );
}

export default SceneView;

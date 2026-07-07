import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionButtonList } from '@chemicalluck/engine/components/action-button-list';
import { ActionGroup } from '@chemicalluck/engine/components/action-group';
import { ItemActionsButtonsList } from '@chemicalluck/engine/components/item-actions-button-list';
import { Progress } from '@chemicalluck/engine/components/ui/progress';
import WithSidebar from '@chemicalluck/engine/components/with-sidebar';
import { renderText } from '@chemicalluck/engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/engine/features/linguistics/use-template-context';
import { selectNpcsByIds } from '@chemicalluck/engine/features/npcs/selectors';
import { worldRng } from '@chemicalluck/engine/features/rng/lib/rng';
import { selectTimestamp } from '@chemicalluck/engine/features/time/selectors';
import * as effects from '@chemicalluck/engine/features/view/helpers';
import { selectDescription } from '@chemicalluck/engine/features/view/selectors';
import { useEngineDispatch, useEngineSelector } from '@chemicalluck/engine/state/store';
import { processEffects } from '@chemicalluck/engine/state/thunks';
import type { Script } from '@chemicalluck/engine/types';

interface ScriptViewProps {
  script: Script;
  npcIds?: string[];
}

function shuffle(indices: number[]): number[] {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(worldRng.next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const EMPTY_NPC_IDS: string[] = [];

function ScriptView({ script, npcIds = EMPTY_NPC_IDS }: ScriptViewProps) {
  const dispatch = useEngineDispatch();
  const currentTimestamp = useEngineSelector(selectTimestamp);
  const currentDescription = useEngineSelector(selectDescription);
  const startTimestamp = useRef(currentTimestamp);
  const npcs = useEngineSelector(selectNpcsByIds(npcIds));
  const ctx = useTemplateContext(npcs);
  const resolve = (text: string) => renderText(text, ctx);

  const { scenes, order, increment, completionEffects } = script;

  const orderedIndices = useRef<number[]>(
    order === 'random'
      ? shuffle(scenes.map((_, i) => i))
      : scenes.map((_, i) => i),
  );

  const [step, setStep] = useState(0);
  const isDone = step >= scenes.length;
  const progressValue = (step / scenes.length) * 100;

  const computedIncrement = useMemo(() => {
    if (increment !== undefined) return increment;
    const totalMinutes =
      'duration' in script && script.duration !== undefined
        ? script.duration
        : (script.endTime - startTimestamp.current) / 60_000;
    return totalMinutes / scenes.length;
  }, [increment, scenes.length, script]);

  useEffect(() => {
    if (isDone) {
      dispatch(processEffects(completionEffects ?? effects.viewDefault()));
    }
  }, [isDone, completionEffects, dispatch]);

  if (isDone) return null;

  const scene = scenes[orderedIndices.current[step]];
  const resolvedGroups = scene.actions.map((group) => ({
    pretext: group.pretext ? resolve(group.pretext) : group.pretext,
    actions: group.actions.map((a) => ({ ...a, text: resolve(a.text) })),
  }));

  return (
    <WithSidebar>
      <p className="m-0">{resolve(scene.text)}</p>
      {currentDescription && (
        <p className="mb-6">{resolve(currentDescription)}</p>
      )}
      {!script.hideProgress && <Progress value={progressValue} />}
      <ActionGroup>
        {resolvedGroups.map((group, i) => (
          // eslint-disable-next-line react-x/no-array-index-key
          <div key={i} className="flex flex-col gap-1">
            {group.pretext && <p>{group.pretext}</p>}
            <ActionButtonList
              actions={group.actions}
              defaultEffects={[{ kind: 'time', minutes: computedIncrement }]}
              callback={() => {
                setStep((s) => s + 1);
              }}
            />
          </div>
        ))}
        <ItemActionsButtonsList />
      </ActionGroup>
    </WithSidebar>
  );
}

export default ScriptView;

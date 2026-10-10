import { useEffect, useMemo, useRef, useState } from 'react';

import { ActionButton } from '@chemicalluck/sim-engine/components/action-button';
import { ActionButtonList } from '@chemicalluck/sim-engine/components/action-button-list';
import { ActionGroup } from '@chemicalluck/sim-engine/components/action-group';
import { ItemActionsButtonsList } from '@chemicalluck/sim-engine/components/item-actions-button-list';
import { Progress } from '@chemicalluck/sim-engine/components/ui/progress';
import WithSidebar from '@chemicalluck/sim-engine/components/with-sidebar';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/use-template-context';
import { selectNpcsByIds } from '@chemicalluck/sim-engine/features/npcs/selectors';
import { worldRng } from '@chemicalluck/sim-engine/features/rng/lib/rng';
import { selectTimestamp } from '@chemicalluck/sim-engine/features/time/selectors';
import * as effects from '@chemicalluck/sim-engine/features/view/helpers';
import {
  selectDescription,
  selectView,
} from '@chemicalluck/sim-engine/features/view/selectors';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions';
import {
  useEngineDispatch,
  useEngineSelector,
  useEngineStore,
} from '@chemicalluck/sim-engine/state/store';
import { processEffects } from '@chemicalluck/sim-engine/state/thunks';
import type { Effect, Script } from '@chemicalluck/sim-engine/types';

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

/** Effects run when a script's `endCondition` ends it after `turnsCompleted` scenes. */
function endConditionEffects(script: Script, turnsCompleted: number): Effect[] {
  if (script.endWith === 'leave') {
    return effects.earlyExitEffects(script, turnsCompleted);
  }
  return script.completionEffects ?? effects.viewDefault();
}

function ScriptView({ script, npcIds = EMPTY_NPC_IDS }: ScriptViewProps) {
  const dispatch = useEngineDispatch();
  const store = useEngineStore();
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
  const [ended, setEnded] = useState(false);
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

  // After each beat: end early when `endCondition` holds, unless the beat's
  // own effects already moved away from this script.
  const afterBeat = () => {
    const turnsCompleted = step + 1;
    const state = store.getState();
    const view = selectView(state);
    const stillHere =
      view.activeViewId === 'ScriptView' && view.props.script === script;
    if (
      script.endCondition &&
      stillHere &&
      isConditionMet(state, script.endCondition)
    ) {
      setEnded(true);
      dispatch(processEffects(endConditionEffects(script, turnsCompleted)));
      return;
    }
    setStep(turnsCompleted);
  };

  if (isDone || ended) return null;

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
              defaultEffects={[
                ...(scene.completionEffects ?? []),
                { kind: 'time', minutes: computedIncrement },
              ]}
              callback={afterBeat}
            />
          </div>
        ))}
        {script.leave && (
          <ActionButton effects={effects.earlyExitEffects(script, step)}>
            {resolve(script.leave.text ?? 'Leave')}
          </ActionButton>
        )}
        <ItemActionsButtonsList />
      </ActionGroup>
    </WithSidebar>
  );
}

export default ScriptView;

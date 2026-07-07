import type { ReactNode } from 'react';
import type {
  JsonActionGroup,
  JsonScene,
  JsonScript,
} from '@chemicalluck/engine/features/core/types';
import type {
  JsonEncounter,
  JsonEncounterState,
} from '@chemicalluck/engine/features/encounter/authoring.types';
import type { JsonRandomEvent } from '@chemicalluck/engine/features/events/authoring.types';
import type { ConversationTopic } from '@chemicalluck/engine/features/npcs/types';
import type { Quest, QuestTemplate } from '@chemicalluck/engine/features/quests/types';
import type { Condition } from '@chemicalluck/engine/types/condition.types';
import type { Effect } from '@chemicalluck/engine/types/effect.types';

import { EffectChip } from '../effect-form';
import { ConditionBadge } from './condition-badge';

export type PreviewEntity =
  | { kind: 'scene'; scene: JsonScene }
  | { kind: 'script'; script: JsonScript }
  | { kind: 'encounter'; encounter: JsonEncounter }
  | { kind: 'event'; event: JsonRandomEvent; script?: JsonScript }
  | { kind: 'conversation'; topic: ConversationTopic }
  | { kind: 'quest'; quest: Quest }
  | { kind: 'questTemplate'; template: QuestTemplate };

/** Narrows an objective condition/trigger (Action | Scene | Condition) to a Condition. */
function asCondition(value: unknown): Condition | undefined {
  if (!value || typeof value !== 'object' || !('kind' in value))
    return undefined;
  const kind = (value as { kind: string }).kind;
  return kind === 'action' || kind === 'scene'
    ? undefined
    : (value as Condition);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function EffectChips({ effects }: { effects?: readonly unknown[] }) {
  if (!effects || effects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {effects.map((effect, i) => (
        // eslint-disable-next-line react-x/no-array-index-key
        <EffectChip key={i} effect={effect as Effect} />
      ))}
    </div>
  );
}

function ActionGroups({ groups }: { groups?: JsonActionGroup[] }) {
  if (!groups || groups.length === 0) {
    return <p className="text-xs text-zinc-600 italic">No actions.</p>;
  }
  return (
    <div className="space-y-2">
      {groups.map((group, gi) => (
        // eslint-disable-next-line react-x/no-array-index-key
        <div key={gi} className="rounded border border-zinc-800 p-2">
          {group.pretext && (
            <p className="mb-1 text-sm text-zinc-400 italic">{group.pretext}</p>
          )}
          {group.actions.map((action, ai) => (
            <div
              // eslint-disable-next-line react-x/no-array-index-key
              key={ai}
              className="flex flex-wrap items-center gap-2 border-t border-zinc-800/60 py-1 first:border-t-0"
            >
              <span className="text-sm text-primary">› {action.text}</span>
              <ConditionBadge condition={action.condition} />
              <EffectChips effects={action.effects} />
              {action.eventIds?.map((id) => (
                <span key={id} className="text-[10px] text-amber-400">
                  event:{id}
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SceneBody({ scene }: { scene: JsonScene }) {
  return (
    <div className="space-y-3">
      <p className="whitespace-pre-wrap text-sm">{scene.text}</p>
      <ActionGroups groups={scene.actions} />
      {scene.completionEffects && scene.completionEffects.length > 0 && (
        <Section title="On completion">
          <EffectChips effects={scene.completionEffects} />
        </Section>
      )}
      {scene.npcSelection && (
        <p className="text-xs text-zinc-500">
          NPC selection: <code>{JSON.stringify(scene.npcSelection)}</code>
        </p>
      )}
    </div>
  );
}

function EncounterStateBody({ state }: { state: JsonEncounterState }) {
  return (
    <div className="rounded border border-zinc-800 p-2 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{state.name}</span>
        <code className="text-xs text-zinc-500">{state.id}</code>
        <ConditionBadge condition={state.condition} />
        {state.transitionTo && (
          <span className="text-[10px] text-zinc-500">
            → {state.transitionTo}
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm text-zinc-300">{state.text}</p>
      {state.actions.map((action, i) => (
        <div
          // eslint-disable-next-line react-x/no-array-index-key
          key={i}
          className="flex flex-wrap items-center gap-2 py-0.5"
        >
          <span className="text-sm text-primary">› {action.text}</span>
          <span className="text-[10px] text-zinc-500">[{action.bodyPart}]</span>
          <ConditionBadge condition={action.condition} />
          <EffectChips effects={action.effects} />
          {action.activateTransition && (
            <span className="text-[10px] text-zinc-500">
              ⇒ {action.activateTransition}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ObjectiveCard({
  state,
  name,
  condition,
  trigger,
  onComplete,
}: {
  state: string;
  name: string;
  condition: unknown;
  trigger?: unknown;
  onComplete?: readonly unknown[];
}) {
  return (
    <div className="rounded border border-zinc-800 p-2 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-zinc-800 px-1.5 text-xs text-zinc-300">
          {state}
        </span>
        <span className="text-sm">{name}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ConditionBadge condition={asCondition(condition)} />
        {trigger != null && (
          <span className="flex items-center gap-1 text-[10px] text-zinc-500">
            trigger:
            <ConditionBadge condition={asCondition(trigger)} />
          </span>
        )}
      </div>
      <EffectChips effects={onComplete} />
    </div>
  );
}

export function NarrativePreview(props: PreviewEntity) {
  // Switching on props.kind is what narrows the discriminated union; a
  // destructured `kind` would lose that narrowing.
  // eslint-disable-next-line react-x/prefer-destructuring-assignment
  switch (props.kind) {
    case 'scene': {
      const { scene } = props;
      return <SceneBody scene={scene} />;
    }

    case 'script': {
      const { script } = props;
      return (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            order: {script.order}
            {script.duration != null &&
              ` · duration ${String(script.duration)}m`}
          </p>
          {script.scenes.map((scene, i) => (
            // eslint-disable-next-line react-x/no-array-index-key
            <div key={i} className="rounded border border-zinc-800 p-2">
              <p className="mb-1 text-xs text-zinc-500">Scene {i + 1}</p>
              <SceneBody scene={scene} />
            </div>
          ))}
          {script.completionEffects && script.completionEffects.length > 0 && (
            <Section title="On completion">
              <EffectChips effects={script.completionEffects} />
            </Section>
          )}
        </div>
      );
    }

    case 'encounter': {
      const { encounter } = props;
      return (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            initial: {encounter.initialStateId}
          </p>
          {encounter.states.map((state) => (
            <EncounterStateBody key={state.id} state={state} />
          ))}
          {encounter.stopEffects && encounter.stopEffects.length > 0 && (
            <Section title="On stop">
              <EffectChips effects={encounter.stopEffects} />
            </Section>
          )}
        </div>
      );
    }

    case 'event': {
      const { event, script } = props;
      return (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            probability: {event.probability}
            {event.cancels === false && ' · does not cancel action'}
          </p>
          <ConditionBadge condition={event.condition} />
          {script ? (
            <div className="rounded border border-zinc-800 p-2">
              <p className="mb-1 text-xs text-zinc-500">
                script: {event.scriptId}
              </p>
              <NarrativePreview kind="script" script={script} />
            </div>
          ) : (
            <p className="text-sm text-red-400">
              References unknown script '{event.scriptId}'
            </p>
          )}
        </div>
      );
    }

    case 'conversation': {
      const { topic } = props;
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">{topic.label}</p>
          {topic.visibility && (
            <p className="text-xs text-zinc-500">
              visibility: <code>{JSON.stringify(topic.visibility)}</code>
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm text-zinc-300">
            “{topic.response}”
          </p>
          <EffectChips effects={topic.effects} />
        </div>
      );
    }

    case 'quest': {
      const { quest } = props;
      return (
        <div className="space-y-2">
          {quest.objectives.map((objective, i) => (
            <ObjectiveCard
              // eslint-disable-next-line react-x/no-array-index-key
              key={i}
              state={objective.state}
              name={objective.name}
              condition={objective.condition}
              trigger={objective.trigger}
              onComplete={objective.onComplete}
            />
          ))}
        </div>
      );
    }

    case 'questTemplate': {
      const { template } = props;
      return (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            id template: <code>{template.idTemplate}</code> · name:{' '}
            <code>{template.name}</code>
          </p>
          <p className="text-[11px] text-zinc-600">
            {'{npc0.*}'} tokens shown literally; resolved per-NPC at runtime.
          </p>
          {template.objectives.map((objective, i) => (
            <ObjectiveCard
              // eslint-disable-next-line react-x/no-array-index-key
              key={i}
              state={objective.state}
              name={objective.name}
              condition={objective.condition}
              onComplete={objective.onComplete}
            />
          ))}
        </div>
      );
    }
  }
}

import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { ActionRow } from '@chemicalluck/sim-engine/editor/components/action-row';
import { ConditionEditor } from '@chemicalluck/sim-engine/editor/components/condition-form';
import { IdSelect } from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import type { AvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import type { JsonSceneRef } from '@chemicalluck/sim-engine/features/quests/authoring.types';
import type {
  ObjectiveCondition,
  ObjectiveTrigger,
} from '@chemicalluck/sim-engine/features/quests/types';
import type { Action } from '@chemicalluck/sim-engine/types/action.types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { Scene } from '@chemicalluck/sim-engine/types/scene.types';

/**
 * An objective `condition` as the editor holds it: quests.json as authored, so
 * a scene objective may still be the `{ kind: 'scene', sceneId }` shorthand.
 */
export type ObjectiveConditionValue = ObjectiveCondition | JsonSceneRef;

type FieldValue = Action | Scene | JsonSceneRef | Condition;
type FieldType = 'condition' | 'action' | 'scene';

const NEW_VALUE = {
  action: { kind: 'action', text: '', effects: [] },
  scene: { kind: 'scene', sceneId: '' },
} satisfies Record<'action' | 'scene', FieldValue>;

const TYPE_TITLES: Record<FieldType, string> = {
  condition: 'a condition',
  action: 'an action',
  scene: 'a scene',
};

function isSceneRef(value: FieldValue): value is JsonSceneRef {
  return value.kind === 'scene' && 'sceneId' in value;
}

interface ObjectiveFieldProps {
  /** Shown before the value, e.g. `trigger` or `condition`. */
  label: string;
  /** Names the field in button titles, e.g. "Set an action trigger". */
  noun: string;
  types: FieldType[];
  value: FieldValue | undefined;
  onChange: (value: FieldValue) => void;
  /** Lets the author clear an optional field. */
  onRemove?: () => void;
  availableData?: AvailableData;
}

/**
 * Edits an objective value that is a condition, an action, or (for `condition`)
 * a scene. Each is shown and edited as what it is: an action with
 * {@link ActionRow}, a scene shorthand with a scene picker, a condition with the
 * condition editor. An inline scene is shown read-only and kept as is. The
 * author picks the type when setting one; picking a different type replaces
 * the value.
 */
function ObjectiveField({
  label,
  noun,
  types,
  value,
  onChange,
  onRemove,
  availableData,
}: ObjectiveFieldProps) {
  const [editingCondition, setEditingCondition] = useState(false);

  if (editingCondition) {
    const isCondition =
      value && value.kind !== 'action' && value.kind !== 'scene';
    return (
      <ConditionEditor
        initial={isCondition ? value : undefined}
        onSave={(c) => {
          onChange(c);
          setEditingCondition(false);
        }}
        onCancel={() => {
          setEditingCondition(false);
        }}
      />
    );
  }

  const current: FieldType | undefined =
    value &&
    (value.kind === 'action' || value.kind === 'scene'
      ? value.kind
      : 'condition');

  const typeButtons = types
    .filter((t) => t !== current)
    .map((t) => (
      <Button
        key={t}
        variant="ghost"
        size="sm"
        onClick={() => {
          if (t === 'condition') setEditingCondition(true);
          else onChange(NEW_VALUE[t]);
        }}
        className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
        title={`Set ${TYPE_TITLES[t]} ${noun}`}
      >
        <Plus size={12} /> {t}
      </Button>
    ));

  // An optional field is cleared before picking another type; a required one
  // offers the other types alongside its value.
  const headerControls = onRemove ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRemove}
      className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
      title={`Remove ${label}`}
    >
      <X size={12} />
    </Button>
  ) : (
    typeButtons
  );

  if (!value) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs text-zinc-500">{label} —</span>
        {typeButtons}
      </div>
    );
  }

  if (value.kind === 'action') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-500">{label}: action</span>
          {headerControls}
        </div>
        <ActionRow
          action={value}
          onChange={onChange}
          availableData={availableData}
        />
      </div>
    );
  }

  if (isSceneRef(value)) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-500">{label}: scene</span>
          {headerControls}
        </div>
        <IdSelect
          label="Scene ID"
          value={value.sceneId}
          onChange={(sceneId) => {
            onChange({ ...value, sceneId });
          }}
          options={(availableData?.scenes as string[] | undefined) ?? []}
          placeholder="sleep"
        />
      </div>
    );
  }

  if (value.kind === 'scene') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-500">
            {label}: inline scene
          </span>
          {headerControls}
        </div>
        <p className="text-xs text-zinc-400 truncate" title={value.text}>
          {value.text || '—'}
        </p>
        <p className="text-xs text-zinc-600 italic">
          Inline scenes are kept as authored; edit them in the JSON file.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <p className="flex-1 text-xs text-zinc-400 truncate font-mono">
        {conditionToString(value)}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditingCondition(true);
        }}
        className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
        title={`Edit ${label}`}
      >
        <Pencil size={12} /> {label}
      </Button>
      {headerControls}
    </div>
  );
}

interface ObjectiveTriggerFieldProps {
  trigger: ObjectiveTrigger | undefined;
  onChange: (trigger: ObjectiveTrigger | undefined) => void;
  availableData?: AvailableData;
}

/**
 * Edits an objective's `trigger`, which is either a condition (unlocks the
 * objective once it holds) or an action (shown once its own condition holds;
 * taking it completes the objective). The author picks the type when setting
 * one; an action trigger is edited like any other action — text, effects and
 * condition.
 */
export function ObjectiveTriggerField({
  trigger,
  onChange,
  availableData,
}: ObjectiveTriggerFieldProps) {
  return (
    <ObjectiveField
      label="trigger"
      noun="trigger"
      types={['condition', 'action']}
      value={trigger}
      // Only condition and action types are offered.
      onChange={(t) => {
        onChange(t as ObjectiveTrigger);
      }}
      onRemove={() => {
        onChange(undefined);
      }}
      availableData={availableData}
    />
  );
}

interface ObjectiveConditionFieldProps {
  condition: ObjectiveConditionValue | undefined;
  onChange: (condition: ObjectiveCondition) => void;
  availableData?: AvailableData;
}

/**
 * Edits an objective's `condition`: a condition (completes the objective once
 * it holds), an action objective (taking it completes the objective), or a
 * scene objective — a scene from scenes.json, or an inline scene, which is
 * shown read-only and preserved.
 */
export function ObjectiveConditionField({
  condition,
  onChange,
  availableData,
}: ObjectiveConditionFieldProps) {
  return (
    <ObjectiveField
      label="condition"
      noun="objective"
      types={['condition', 'action', 'scene']}
      value={condition}
      // The quest editors type quests.json by its hydrated shape, which has no
      // scene shorthand; the shorthand is valid authored content, saved as is.
      onChange={(c) => {
        onChange(c as ObjectiveCondition);
      }}
      availableData={availableData}
    />
  );
}

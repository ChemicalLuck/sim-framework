import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { ActionRow } from '@chemicalluck/sim-engine/editor/components/action-row';
import { ConditionEditor } from '@chemicalluck/sim-engine/editor/components/condition-form';
import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import type { AvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import type { ObjectiveTrigger } from '@chemicalluck/sim-engine/features/quests/types';

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
  const [editingCondition, setEditingCondition] = useState(false);

  const removeButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        onChange(undefined);
      }}
      className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
      title="Remove trigger"
    >
      <X size={12} />
    </Button>
  );

  if (editingCondition) {
    return (
      <ConditionEditor
        initial={trigger && trigger.kind !== 'action' ? trigger : undefined}
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

  if (trigger?.kind === 'action') {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-xs text-zinc-500">trigger: action</span>
          {removeButton}
        </div>
        <ActionRow
          action={trigger}
          onChange={onChange}
          availableData={availableData}
        />
      </div>
    );
  }

  if (trigger) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 shrink-0">trigger</span>
        <p className="flex-1 text-xs text-zinc-400 truncate font-mono">
          {conditionToString(trigger)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingCondition(true);
          }}
          className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
          title="Edit trigger"
        >
          <Pencil size={12} /> trigger
        </Button>
        {removeButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-xs text-zinc-500">trigger —</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setEditingCondition(true);
        }}
        className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
        title="Set a condition trigger"
      >
        <Plus size={12} /> condition
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onChange({ kind: 'action', text: '', effects: [] });
        }}
        className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
        title="Set an action trigger"
      >
        <Plus size={12} /> action
      </Button>
    </div>
  );
}

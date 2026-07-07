import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@chemicalluck/sim-engine/components/ui/badge';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@chemicalluck/sim-engine/components/ui/select';
import type { Action } from '@chemicalluck/sim-engine/types/action.types';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

import type { AvailableData } from '../lib/use-available-data';
import { ConditionField } from './condition-field';
import { AddEffectForm, EffectChip } from './effect-form';
import { editorTemplateContext } from './template-context';
import { TemplateEditor } from './template-editor';

export type ActionShape = Action;

interface ActionRowProps {
  action: Action;
  onChange: (updated: Action) => void;
  onRemove?: () => void;
  availableData?: AvailableData;
}

export function ActionRow({
  action,
  onChange,
  onRemove,
  availableData,
}: ActionRowProps) {
  const [showAddEffect, setShowAddEffect] = useState(false);
  const [editingEffectIdx, setEditingEffectIdx] = useState<number | null>(null);

  const effects = action.effects ?? [];
  const editingEffect =
    editingEffectIdx != null ? effects[editingEffectIdx] : undefined;

  function addEffect(effect: Effect) {
    onChange({ ...action, effects: [...effects, effect] });
    setShowAddEffect(false);
  }

  function removeEffect(idx: number) {
    if (editingEffectIdx === idx) setEditingEffectIdx(null);
    onChange({ ...action, effects: effects.filter((_, i) => i !== idx) });
  }

  function replaceEffect(idx: number, effect: Effect) {
    onChange({
      ...action,
      effects: effects.map((e, i) => (i === idx ? effect : e)),
    });
  }

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-2 px-3 py-2 bg-zinc-800">
        <div className="flex-1 min-w-0">
          <TemplateEditor
            value={action.text}
            onChange={(v) => {
              onChange({ ...action, text: v });
            }}
            context={editorTemplateContext()}
          />
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
            title="Remove action"
          >
            <X size={12} />
          </Button>
        )}
      </div>

      {/* Effects row */}
      <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-700/50 space-y-2">
        <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
          {effects.map((eff, i) => (
            <EffectChip
              // eslint-disable-next-line
              key={i}
              effect={eff}
              onRemove={() => {
                removeEffect(i);
              }}
              onClick={() => {
                setShowAddEffect(false);
                setEditingEffectIdx(i);
              }}
            />
          ))}
          {!showAddEffect && editingEffectIdx == null && (
            <Button
              onClick={() => {
                setShowAddEffect(true);
              }}
              size="sm"
              variant="ghost"
              title="Add effect"
            >
              <Plus size={12} /> effect
            </Button>
          )}
        </div>
        {showAddEffect && (
          <AddEffectForm
            onAdd={addEffect}
            onCancel={() => {
              setShowAddEffect(false);
            }}
            availableData={availableData}
          />
        )}
        {editingEffectIdx != null && editingEffect && (
          <AddEffectForm
            initial={editingEffect}
            onAdd={(eff) => {
              replaceEffect(editingEffectIdx, eff);
              setEditingEffectIdx(null);
            }}
            onCancel={() => {
              setEditingEffectIdx(null);
            }}
            availableData={availableData}
          />
        )}

        {/* Events row */}
        {((action.eventIds?.length ?? 0) > 0 ||
          ((availableData?.events as string[] | undefined)?.length ?? 0) >
            0) && (
          <div className="border-t border-zinc-700/30 pt-1.5">
            <EventIdsField
              eventIds={action.eventIds ?? []}
              availableEventIds={
                (availableData?.events as string[] | undefined) ?? []
              }
              onChange={(ids) => {
                onChange({ ...action, eventIds: ids.length ? ids : undefined });
              }}
            />
          </div>
        )}

        {/* Condition row */}
        <div className="border-t border-zinc-700/30 pt-1.5">
          <ConditionField
            condition={action.condition}
            onChange={(c) => {
              onChange({ ...action, condition: c });
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface EventIdsFieldProps {
  eventIds: string[];
  availableEventIds: string[];
  onChange: (ids: string[]) => void;
}

function EventIdsField({
  eventIds,
  availableEventIds,
  onChange,
}: EventIdsFieldProps) {
  const unassigned = availableEventIds.filter((id) => !eventIds.includes(id));

  return (
    <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
      {eventIds.map((id) => (
        <Badge
          key={id}
          className="bg-violet-950/60 text-violet-300 border border-violet-800/50 font-mono text-xs gap-1"
        >
          {id}
          <button
            onClick={() => {
              onChange(eventIds.filter((e) => e !== id));
            }}
            className="opacity-50 hover:opacity-100 leading-none"
            title="Remove event"
          >
            <X size={10} />
          </button>
        </Badge>
      ))}
      {unassigned.length > 0 && (
        <Select
          key={eventIds.join(',')}
          onValueChange={(v) => {
            onChange([...eventIds, v]);
          }}
        >
          <SelectTrigger className="h-8 w-auto gap-1.5 px-3 border-0 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground text-sm font-medium [&>svg:last-child]:hidden">
            <Plus size={12} /> event
          </SelectTrigger>
          <SelectContent>
            {unassigned.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

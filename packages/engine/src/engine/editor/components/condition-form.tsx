import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Badge } from '@chemicalluck/sim-engine/components/ui/badge';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@chemicalluck/sim-engine/components/ui/form';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { parseConditionSafe } from '@chemicalluck/sim-engine/lib/conditions/parser';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import { conditionToString } from '../lib/condition-utils';

// ── Chip ─────────────────────────────────────────────────────────

export function ConditionChip({
  condition,
  onEdit,
  onRemove,
}: {
  condition: Condition;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const label = conditionToString(condition);
  return (
    <Badge className="bg-amber-950/60 text-amber-300 border border-amber-800/50 font-mono text-xs max-w-full truncate">
      <span
        className={
          onEdit ? 'cursor-pointer hover:text-amber-100 truncate' : 'truncate'
        }
        title={label}
        onClick={onEdit}
      >
        if: {label}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="opacity-50 hover:opacity-100 leading-none pl-0.5 shrink-0"
          title="Remove condition"
        >
          <X size={10} />
        </button>
      )}
    </Badge>
  );
}

// ── Editor ───────────────────────────────────────────────────────

interface ConditionEditorProps {
  initial?: Condition;
  onSave: (c: Condition) => void;
  onCancel: () => void;
}

export function ConditionEditor({
  initial,
  onSave,
  onCancel,
}: ConditionEditorProps) {
  const form = useForm<{ value: string }>({
    defaultValues: { value: initial ? conditionToString(initial) : '' },
  });

  function handleSave() {
    void form.handleSubmit(({ value: val }) => {
      onSave(parseConditionSafe(val.trim()));
    })();
  }

  return (
    <Form {...form}>
      <div className="space-y-1">
        <FormField
          control={form.control}
          name="value"
          rules={{
            validate: (v) => {
              if (!v.trim()) return 'Required';
              try {
                parseConditionSafe(v.trim());
                return true;
              } catch (e) {
                return (e as Error).message;
              }
            },
          }}
          render={({ field }) => (
            <>
              <div className="flex items-center gap-1.5">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="need.energy >= 50 || milestone.has_key"
                    className="h-7 text-xs font-mono bg-zinc-800 border-zinc-600 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave();
                      if (e.key === 'Escape') onCancel();
                    }}
                  />
                </FormControl>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!field.value.trim()}
                  className="h-7 text-xs shrink-0"
                >
                  OK
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="h-7 text-xs text-zinc-500 hover:text-zinc-300 shrink-0"
                >
                  Cancel
                </Button>
              </div>
              <FormMessage className="text-xs font-mono" />
            </>
          )}
        />
      </div>
    </Form>
  );
}

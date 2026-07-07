import { useState } from 'react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

import { ConditionChip, ConditionEditor } from './condition-form';

interface ConditionFieldProps {
  condition: Condition | undefined;
  onChange: (c: Condition | undefined) => void;
  className?: string;
}

export function ConditionField({
  condition,
  onChange,
  className,
}: ConditionFieldProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ConditionEditor
        initial={condition}
        onSave={(c) => {
          onChange(c);
          setEditing(false);
        }}
        onCancel={() => {
          setEditing(false);
        }}
      />
    );
  }

  if (condition) {
    return (
      <ConditionChip
        condition={condition}
        onEdit={() => {
          setEditing(true);
        }}
        onRemove={() => {
          onChange(undefined);
        }}
      />
    );
  }

  return (
    <Button
      onClick={() => {
        setEditing(true);
      }}
      size="sm"
      variant="ghost"
      className={
        className ?? 'h-6 text-xs text-zinc-600 hover:text-zinc-400 px-1'
      }
    >
      + condition
    </Button>
  );
}

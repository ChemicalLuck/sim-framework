import { Field } from '@chemicalluck/engine/components/ui/field';
import { Input } from '@chemicalluck/engine/components/ui/input';
import { Label } from '@chemicalluck/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';
import {
  NumField,
  TwoCol,
} from '@chemicalluck/engine/editor/components/effect-form-primitives';
import { defineEffectEditor } from '@chemicalluck/engine/editor/lib/effect-editor';

import type { EventCategory } from './types';

type Operation = 'add' | 'remove' | 'clear';

interface CalendarFormState {
  operation: Operation;
  id: string;
  label: string;
  category: string;
  dayOfWeek: string;
  hour: string;
  durationMinutes: string;
}

const emptyState: CalendarFormState = {
  operation: 'add',
  id: '',
  label: '',
  category: 'work',
  dayOfWeek: '1',
  hour: '9',
  durationMinutes: '60',
};

const calendar = defineEffectEditor<CalendarFormState>({
  kind: 'calendar',
  color: 'bg-amber-900/60 text-amber-300',
  label: (e) => {
    if (e.kind !== 'calendar') return 'fx';
    if (e.operation === 'add') return `cal:+${e.event.id}`;
    if (e.operation === 'remove') return `cal:-${e.id}`;
    return 'cal:clear';
  },
  defaultState: emptyState,
  toFormState: (e) => {
    if (e.kind !== 'calendar') return emptyState;
    if (e.operation === 'add') {
      return {
        operation: 'add',
        id: e.event.id,
        label: e.event.label,
        category: e.event.category,
        dayOfWeek: String(e.event.dayOfWeek),
        hour: String(e.event.hour),
        durationMinutes: String(e.event.durationMinutes),
      };
    }
    if (e.operation === 'remove') {
      return { ...emptyState, operation: 'remove', id: e.id };
    }
    return { ...emptyState, operation: 'clear' };
  },
  buildEffect: (s) => {
    if (s.operation === 'clear')
      return { kind: 'calendar', operation: 'clear' };
    if (s.operation === 'remove') {
      if (!s.id.trim()) return null;
      return { kind: 'calendar', operation: 'remove', id: s.id.trim() };
    }
    if (!s.id.trim() || !s.label.trim()) return null;
    return {
      kind: 'calendar',
      operation: 'add',
      event: {
        id: s.id.trim(),
        label: s.label.trim(),
        category: (s.category.trim() || 'work') as EventCategory,
        dayOfWeek: (Number(s.dayOfWeek) || 1) as 1 | 2 | 3 | 4 | 5,
        hour: Number(s.hour) || 0,
        durationMinutes: Number(s.durationMinutes) || 0,
      },
    };
  },
  Fields: ({ value, onChange }) => (
    <>
      <Field>
        <Label>Operation</Label>
        <Select
          value={value.operation}
          onValueChange={(v) => {
            onChange({ operation: v as Operation });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Add / update</SelectItem>
            <SelectItem value="remove">Remove</SelectItem>
            <SelectItem value="clear">Clear all</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {value.operation !== 'clear' && (
        <Field>
          <Label>Event ID</Label>
          <Input
            value={value.id}
            onChange={(e) => {
              onChange({ id: e.target.value });
            }}
            placeholder="shift_monday"
          />
        </Field>
      )}

      {value.operation === 'add' && (
        <>
          <Field>
            <Label>Label</Label>
            <Input
              value={value.label}
              onChange={(e) => {
                onChange({ label: e.target.value });
              }}
              placeholder="Café shift"
            />
          </Field>
          <Field>
            <Label>Category</Label>
            <Input
              value={value.category}
              onChange={(e) => {
                onChange({ category: e.target.value });
              }}
              placeholder="work"
            />
          </Field>
          <TwoCol>
            <NumField
              label="Day (1–5)"
              value={value.dayOfWeek}
              onChange={(v) => {
                onChange({ dayOfWeek: v });
              }}
              min="1"
              max="5"
            />
            <NumField
              label="Hour (0–23)"
              value={value.hour}
              onChange={(v) => {
                onChange({ hour: v });
              }}
              min="0"
              max="23"
            />
          </TwoCol>
          <NumField
            label="Duration (minutes)"
            value={value.durationMinutes}
            onChange={(v) => {
              onChange({ durationMinutes: v });
            }}
            min="0"
            step="5"
          />
        </>
      )}
    </>
  ),
});

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    calendar: typeof calendar;
  }
}

export default { calendar };

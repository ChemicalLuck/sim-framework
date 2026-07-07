import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import {
  NumField,
  TwoCol,
} from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import { defineEffectEditor } from '@chemicalluck/sim-engine/editor/lib/effect-editor';

interface TimeFormState {
  hours: string;
  minutes: string;
}

const time = defineEffectEditor<TimeFormState>({
  kind: 'time',
  color: 'bg-blue-900/60 text-blue-300',
  label: (e) => {
    if (e.kind !== 'time') return 'fx';
    const h = e.hours ? `${String(e.hours)}h ` : '';
    return `+${h}${String(e.minutes)}min`;
  },
  defaultState: { hours: '', minutes: '0' },
  toFormState: (e) => {
    if (e.kind !== 'time') return { hours: '', minutes: '0' };
    return {
      hours: e.hours != null ? String(e.hours) : '',
      minutes: String(e.minutes),
    };
  },
  buildEffect: (s) => {
    const h = Number(s.hours) || 0;
    const m = Number(s.minutes) || 0;
    return h > 0
      ? { kind: 'time', hours: h, minutes: m }
      : { kind: 'time', minutes: m };
  },
  Fields: ({ value, onChange }) => (
    <TwoCol>
      <NumField
        label="Hours (optional)"
        value={value.hours}
        onChange={(v) => {
          onChange({ hours: v });
        }}
        min="0"
        placeholder="0"
      />
      <NumField
        label="Minutes"
        value={value.minutes}
        onChange={(v) => {
          onChange({ minutes: v });
        }}
        min="0"
      />
    </TwoCol>
  ),
});

type SleepMode = 'hours' | 'wakeTime';
const SLEEP_MODES: { value: SleepMode; label: string }[] = [
  { value: 'hours', label: 'Duration (hours)' },
  { value: 'wakeTime', label: 'Wake at hour' },
];

interface SleepFormState {
  mode: SleepMode;
  amount: string;
}

const sleep = defineEffectEditor<SleepFormState>({
  kind: 'sleep',
  color: 'bg-indigo-900/60 text-indigo-300',
  label: (e) => {
    if (e.kind !== 'sleep') return 'fx';
    return e.wakeTime != null
      ? `wake@${String(e.wakeTime)}h`
      : `sleep ${String(e.hours ?? 0)}h`;
  },
  defaultState: { mode: 'hours', amount: '8' },
  toFormState: (e) => {
    if (e.kind !== 'sleep') return { mode: 'hours', amount: '8' };
    if (e.wakeTime != null)
      return { mode: 'wakeTime', amount: String(e.wakeTime) };
    return { mode: 'hours', amount: String(e.hours ?? 8) };
  },
  buildEffect: (s) =>
    s.mode === 'wakeTime'
      ? { kind: 'sleep', wakeTime: Number(s.amount) || 8 }
      : { kind: 'sleep', hours: Number(s.amount) || 8 },
  Fields: ({ value, onChange }) => (
    <TwoCol>
      <Field>
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) => {
            onChange({ mode: v as SleepMode });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SLEEP_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <NumField
        label={value.mode === 'wakeTime' ? 'Wake hour (0–23)' : 'Hours'}
        value={value.amount}
        onChange={(v) => {
          onChange({ amount: v });
        }}
        min="0"
        max={value.mode === 'wakeTime' ? '23' : undefined}
      />
    </TwoCol>
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    time: typeof time;
    sleep: typeof sleep;
  }
}

export default { time, sleep };

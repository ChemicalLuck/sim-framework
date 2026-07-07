import { Field } from '@chemicalluck/engine/components/ui/field';
import { Label } from '@chemicalluck/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';
import { defineEffectEditor } from '@chemicalluck/engine/editor/lib/effect-editor';

import type { WeatherConditionId } from './types';

const CLEAR = '__clear__';

const WEATHER_CONDITIONS: WeatherConditionId[] = [
  'sunny',
  'hot_sunny',
  'partly_cloudy',
  'cloudy',
  'overcast',
  'light_rain',
  'rainy',
  'windy',
  'snowy',
  'freezing',
];

interface WeatherFormState {
  conditionId: WeatherConditionId | null;
}

const weather = defineEffectEditor<WeatherFormState>({
  kind: 'weather',
  color: 'bg-sky-900/60 text-sky-300',
  label: (e) => {
    if (e.kind !== 'weather') return 'fx';
    return e.conditionId == null ? 'weather:clear' : `weather:${e.conditionId}`;
  },
  defaultState: { conditionId: null },
  toFormState: (e) => ({
    conditionId: e.kind === 'weather' ? e.conditionId : null,
  }),
  buildEffect: (s) => ({ kind: 'weather', conditionId: s.conditionId }),
  Fields: ({ value, onChange }) => (
    <Field>
      <Label>Condition</Label>
      <Select
        value={value.conditionId ?? CLEAR}
        onValueChange={(v) => {
          onChange({
            conditionId: v === CLEAR ? null : (v as WeatherConditionId),
          });
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR}>— clear override —</SelectItem>
          {WEATHER_CONDITIONS.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  ),
});

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    weather: typeof weather;
  }
}

export default { weather };

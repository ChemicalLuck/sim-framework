import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
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
import type { Effect } from '@chemicalluck/sim-engine/types';

import { getWeatherConditions } from './lib/config';
import type { WeatherConditionId, WeatherEffect } from './types';

const CLEAR = '__clear__';

interface WeatherFormState {
  conditionId: WeatherConditionId | null;
  /** Hours the override lasts; blank = until `until` or cleared. */
  durationHours: string;
  /** ISO game time the override expires at; used when no duration is set. */
  until: string;
  /** Temperature (°C) while overridden; blank = computed. */
  temperature: string;
}

function toNumber(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const weather = defineEffectEditor<WeatherFormState>({
  kind: 'weather',
  color: 'bg-sky-900/60 text-sky-300',
  label: (e) => {
    if (e.kind !== 'weather') return 'fx';
    if (e.conditionId == null) return 'weather:clear';
    const duration =
      e.durationHours !== undefined
        ? ` ${String(e.durationHours)}h`
        : e.until !== undefined
          ? ` until ${e.until}`
          : '';
    const temperature =
      e.temperature !== undefined ? ` ${String(e.temperature)}°C` : '';
    return `weather:${e.conditionId}${duration}${temperature}`;
  },
  defaultState: {
    conditionId: null,
    durationHours: '',
    until: '',
    temperature: '',
  },
  toFormState: (e) =>
    e.kind === 'weather'
      ? {
          conditionId: e.conditionId,
          durationHours:
            e.durationHours !== undefined ? String(e.durationHours) : '',
          until: e.until ?? '',
          temperature: e.temperature !== undefined ? String(e.temperature) : '',
        }
      : { conditionId: null, durationHours: '', until: '', temperature: '' },
  buildEffect: (s): Effect => {
    if (s.conditionId === null) return { kind: 'weather', conditionId: null };
    const durationHours = toNumber(s.durationHours);
    const temperature = toNumber(s.temperature);
    const until = s.until.trim();
    const effect: WeatherEffect = {
      kind: 'weather',
      conditionId: s.conditionId,
      ...(durationHours !== undefined && durationHours > 0
        ? { durationHours }
        : until
          ? { until }
          : {}),
      ...(temperature !== undefined ? { temperature } : {}),
    };
    return effect;
  },
  Fields: ({ value, onChange }) => (
    <>
      <Field>
        <Label>Condition</Label>
        <Select
          value={value.conditionId ?? CLEAR}
          onValueChange={(v) => {
            onChange({
              conditionId: v === CLEAR ? null : v,
            });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLEAR}>— clear override —</SelectItem>
            {Object.keys(getWeatherConditions()).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {value.conditionId !== null && (
        <>
          <TwoCol>
            <NumField
              label="Duration (hours, optional)"
              value={value.durationHours}
              onChange={(v) => {
                onChange({ durationHours: v });
              }}
              min="0"
              placeholder="until cleared"
            />
            <NumField
              label="Temperature °C (optional)"
              value={value.temperature}
              onChange={(v) => {
                onChange({ temperature: v });
              }}
              placeholder="computed"
            />
          </TwoCol>
          {value.durationHours.trim() === '' && (
            <Field>
              <Label>Until (game time, optional)</Label>
              <Input
                value={value.until}
                onChange={(e) => {
                  onChange({ until: e.target.value });
                }}
                placeholder="2025-03-01T18:00:00"
              />
            </Field>
          )}
        </>
      )}
    </>
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    weather: typeof weather;
  }
}

export default { weather };

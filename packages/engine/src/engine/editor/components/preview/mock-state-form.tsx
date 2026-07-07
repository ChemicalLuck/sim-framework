import { Field, FieldGroup } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import { WEATHER_CONDITIONS } from '@chemicalluck/sim-engine/features/weather/lib/conditions';

import { usePreviewState } from './mock-state';

const WEATHER_IDS = Object.keys(WEATHER_CONDITIONS);

function parseRecord(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pair of text.split(',')) {
    const [k, v] = pair.split('=');
    const key = k.trim();
    if (!key) continue;
    const num = Number(v);
    out[key] = Number.isNaN(num) ? 0 : num;
  }
  return out;
}

function parseList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function recordToText(record: Record<string, number>): string {
  return Object.entries(record)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(', ');
}

/**
 * Compact editor for the shared mock state. Needs/skills/milestones use
 * comma-separated text (`energy=0.5, hunger=0.2`) to stay terse — this is a
 * dev preview tool, not player-facing.
 */
export function MockStateForm() {
  const { values, setValues } = usePreviewState();
  const patch = (next: Partial<typeof values>) => {
    setValues({ ...values, ...next });
  };

  return (
    <FieldGroup className="grid grid-cols-2 gap-2">
      <Field>
        <Label>Date</Label>
        <Input
          type="date"
          value={values.date}
          onChange={(e) => {
            patch({ date: e.target.value });
          }}
        />
      </Field>
      <Field>
        <Label>Hour (0–23)</Label>
        <Input
          type="number"
          min="0"
          max="23"
          value={values.hour}
          onChange={(e) => {
            patch({ hour: Number(e.target.value) || 0 });
          }}
        />
      </Field>
      <Field>
        <Label>Money</Label>
        <Input
          type="number"
          value={values.money}
          onChange={(e) => {
            patch({ money: Number(e.target.value) || 0 });
          }}
        />
      </Field>
      <Field>
        <Label>Location</Label>
        <Input
          value={values.location}
          onChange={(e) => {
            patch({ location: e.target.value });
          }}
          placeholder="campus_cafe"
        />
      </Field>
      <Field>
        <Label>Weather</Label>
        <Select
          value={values.weather || '__computed__'}
          onValueChange={(v) => {
            patch({ weather: v === '__computed__' ? '' : v });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__computed__">— computed —</SelectItem>
            {WEATHER_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <Label>Milestones</Label>
        <Input
          defaultValue={values.milestones.join(', ')}
          onChange={(e) => {
            patch({ milestones: parseList(e.target.value) });
          }}
          placeholder="got_job, freshman_week"
        />
      </Field>
      <Field>
        <Label>Needs</Label>
        <Input
          defaultValue={recordToText(values.needs)}
          onChange={(e) => {
            patch({ needs: parseRecord(e.target.value) });
          }}
          placeholder="energy=0.5, hunger=0.2"
        />
      </Field>
      <Field>
        <Label>Skills</Label>
        <Input
          defaultValue={recordToText(values.skills)}
          onChange={(e) => {
            patch({ skills: parseRecord(e.target.value) });
          }}
          placeholder="athletics=5"
        />
      </Field>
    </FieldGroup>
  );
}

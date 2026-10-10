import { Checkbox } from '@chemicalluck/sim-engine/components/ui/checkbox';
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
import { defineEffectEditor } from '@chemicalluck/sim-engine/editor/lib/effect-editor';

// `equip` is registered hidden — surfaced on the chip but never offered in
// the kind picker because equip effects are emitted by runtime handlers,
// not authored in JSON.
interface EquipFormState {
  operation: 'don' | 'doff';
}

const equip = defineEffectEditor<EquipFormState>({
  kind: 'equip',
  color: 'bg-violet-900/60 text-violet-300',
  label: (e) => (e.kind === 'equip' ? e.operation : 'fx'),
  defaultState: { operation: 'don' },
  toFormState: (e) =>
    e.kind === 'equip' ? { operation: e.operation } : { operation: 'don' },
  buildEffect: () => null,
  Fields: () => null,
  hidden: true,
});

type TriState = 'keep' | 'true' | 'false';

interface WearableConditionFormState {
  target: string;
  wet: TriState;
  dirty: TriState;
  /** Empty string keeps the current wear time. */
  wearMinutes: string;
  silent: boolean;
}

const toTri = (v: boolean | undefined): TriState =>
  v == null ? 'keep' : v ? 'true' : 'false';
const fromTri = (v: TriState): boolean | undefined =>
  v === 'keep' ? undefined : v === 'true';

const TRI_OPTIONS: { value: TriState; label: string }[] = [
  { value: 'keep', label: 'unchanged' },
  { value: 'true', label: 'yes' },
  { value: 'false', label: 'no' },
];

function triSelect(
  label: string,
  value: TriState,
  onChange: (v: TriState) => void,
) {
  return (
    <Field>
      <Label>{label}</Label>
      <Select
        value={value}
        onValueChange={(v) => {
          onChange(v as TriState);
        }}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRI_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

const wearable_condition = defineEffectEditor<WearableConditionFormState>({
  kind: 'wearable_condition',
  color: 'bg-violet-900/60 text-violet-200',
  label: (e) => {
    if (e.kind !== 'wearable_condition') return 'fx';
    if (!e.set) return e.target === '*' ? 'wear:reset*' : `wear:${e.target}`;
    return `wear:set:${e.target}`;
  },
  defaultState: {
    target: '*',
    wet: 'keep',
    dirty: 'keep',
    wearMinutes: '',
    silent: false,
  },
  toFormState: (e) => {
    if (e.kind !== 'wearable_condition') {
      return {
        target: '*',
        wet: 'keep',
        dirty: 'keep',
        wearMinutes: '',
        silent: false,
      };
    }
    return {
      target: e.target,
      wet: toTri(e.set?.wet),
      dirty: toTri(e.set?.dirty),
      wearMinutes: e.set?.wearMinutes == null ? '' : String(e.set.wearMinutes),
      silent: e.silent ?? false,
    };
  },
  buildEffect: (s) => {
    const target = s.target.trim();
    if (!target) return null;
    const minutes = s.wearMinutes.trim();
    if (minutes !== '' && !Number.isFinite(Number(minutes))) return null;
    const set = {
      ...(s.wet !== 'keep' && { wet: fromTri(s.wet) }),
      ...(s.dirty !== 'keep' && { dirty: fromTri(s.dirty) }),
      ...(minutes !== '' && { wearMinutes: Number(minutes) }),
    };
    return {
      kind: 'wearable_condition',
      target,
      ...(Object.keys(set).length > 0 && { set }),
      ...(s.silent && { silent: true }),
    };
  },
  Fields: ({ value, onChange }) => (
    <>
      <Field>
        <Label>Target wearable id (or "*" for all)</Label>
        <Input
          value={value.target}
          onChange={(e) => {
            onChange({ target: e.target.value });
          }}
          placeholder="*"
        />
      </Field>
      <p className="text-xs text-zinc-500">
        Leave every field unchanged to launder (reset to clean, dry, unworn).
      </p>
      {triSelect('Wet', value.wet, (wet) => {
        onChange({ wet });
      })}
      {triSelect('Dirty', value.dirty, (dirty) => {
        onChange({ dirty });
      })}
      <Field>
        <Label>Wear minutes</Label>
        <Input
          type="number"
          value={value.wearMinutes}
          onChange={(e) => {
            onChange({ wearMinutes: e.target.value });
          }}
          placeholder="unchanged"
        />
      </Field>
      <Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="wearable-condition-silent"
            checked={value.silent}
            onCheckedChange={(v) => {
              onChange({ silent: v === true });
            }}
          />
          <Label htmlFor="wearable-condition-silent">Silent (no toast)</Label>
        </div>
      </Field>
    </>
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    equip: typeof equip;
    wearable_condition: typeof wearable_condition;
  }
}

export default { equip, wearable_condition };

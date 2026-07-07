import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
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

interface WearableConditionFormState {
  target: string;
}

const wearable_condition = defineEffectEditor<WearableConditionFormState>({
  kind: 'wearable_condition',
  color: 'bg-violet-900/60 text-violet-200',
  label: (e) => {
    if (e.kind !== 'wearable_condition') return 'fx';
    return e.target === '*' ? 'wear:reset*' : `wear:${e.target}`;
  },
  defaultState: { target: '*' },
  toFormState: (e) => ({
    target: e.kind === 'wearable_condition' ? e.target : '*',
  }),
  buildEffect: (s) => {
    if (!s.target.trim()) return null;
    return { kind: 'wearable_condition', target: s.target.trim() };
  },
  Fields: ({ value, onChange }) => (
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
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    equip: typeof equip;
    wearable_condition: typeof wearable_condition;
  }
}

export default { equip, wearable_condition };

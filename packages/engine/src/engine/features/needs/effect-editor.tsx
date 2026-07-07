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
import {
  type DataRequirement,
  defineEffectEditor,
} from '@chemicalluck/engine/editor/lib/effect-editor';

interface NeedsFormState {
  need: string;
  delta: string;
  target: 'player' | 'npc';
}

const needs = defineEffectEditor<NeedsFormState>({
  kind: 'needs',
  color: 'bg-green-900/60 text-green-300',
  label: (e) => {
    if (e.kind !== 'needs') return 'fx';
    return `${e.need} ${e.delta > 0 ? '+' : ''}${String(e.delta)}`;
  },
  defaultState: { need: '', delta: '', target: 'player' },
  toFormState: (e) => {
    if (e.kind !== 'needs') return { need: '', delta: '', target: 'player' };
    return {
      need: e.need,
      delta: String(e.delta),
      target: e.target === 'npc' ? 'npc' : 'player',
    };
  },
  buildEffect: (s) => {
    if (!s.need.trim()) return null;
    return {
      kind: 'needs',
      need: s.need.trim(),
      delta: Number(s.delta) || 0,
      ...(s.target === 'npc' ? { target: 'npc' as const } : {}),
    };
  },
  Fields: ({ value, onChange, availableData }) => {
    const needTypes = (availableData?.needs as string[] | undefined) ?? [];
    return (
      <>
        <TwoCol>
          <Field>
            <Label>Need</Label>
            <Input
              value={value.need}
              onChange={(e) => {
                onChange({ need: e.target.value });
              }}
              placeholder="Hunger"
              list="need-types"
            />
            <datalist id="need-types">
              {needTypes.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <NumField
            label="Delta (±)"
            value={value.delta}
            onChange={(v) => {
              onChange({ delta: v });
            }}
          />
        </TwoCol>
        <Field>
          <Label>Target</Label>
          <Select
            value={value.target}
            onValueChange={(v) => {
              onChange({ target: v as 'player' | 'npc' });
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="player">player</SelectItem>
              <SelectItem value="npc">npc (encounter only)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </>
    );
  },
});

export const editorDataRequirements: DataRequirement[] = [
  {
    key: 'needs',
    extract: (raw) =>
      Object.keys((raw as { needs?: Record<string, unknown> }).needs ?? {}),
  },
];

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    needs: typeof needs;
  }
}

export default { needs };

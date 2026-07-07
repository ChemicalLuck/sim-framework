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
  IdSelect,
  NumField,
  TwoCol,
} from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@chemicalluck/sim-engine/editor/lib/effect-editor';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

interface InventoryFormState {
  operation: 'add' | 'remove';
  id: string;
}

const inventory = defineEffectEditor<InventoryFormState>({
  kind: 'inventory',
  color: 'bg-pink-900/60 text-pink-300',
  label: (e) => {
    if (e.kind !== 'inventory') return 'fx';
    if (e.operation === 'add') {
      const raw = e as unknown as { itemId?: string; item?: { id: string } };
      return `+${raw.itemId ?? raw.item?.id ?? '?'}`;
    }
    return `-${e.id}`;
  },
  defaultState: { operation: 'add', id: '' },
  toFormState: (e) => {
    if (e.kind !== 'inventory') return { operation: 'add', id: '' };
    const raw = e as unknown as {
      operation: 'add' | 'remove';
      id?: string;
      itemId?: string;
      item?: { id: string };
    };
    if (raw.operation === 'add') {
      return { operation: 'add', id: raw.itemId ?? raw.item?.id ?? '' };
    }
    return { operation: 'remove', id: raw.id ?? '' };
  },
  buildEffect: (s) => {
    if (!s.id.trim()) return null;
    if (s.operation === 'add') {
      return {
        kind: 'inventory',
        operation: 'add',
        itemId: s.id.trim(),
      } as unknown as Effect;
    }
    return {
      kind: 'inventory',
      operation: 'remove',
      id: s.id.trim(),
    } as unknown as Effect;
  },
  Fields: ({ value, onChange, availableData }) => (
    <TwoCol>
      <Field>
        <Label>Operation</Label>
        <Select
          value={value.operation}
          onValueChange={(v) => {
            onChange({ operation: v as 'add' | 'remove' });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add">add</SelectItem>
            <SelectItem value="remove">remove</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <IdSelect
        label="Item ID"
        value={value.id}
        onChange={(v) => {
          onChange({ id: v });
        }}
        options={(availableData?.items as string[] | undefined) ?? []}
      />
    </TwoCol>
  ),
});

interface SkillFormState {
  skill: string;
  delta: string;
}

const skill = defineEffectEditor<SkillFormState>({
  kind: 'skill',
  color: 'bg-teal-900/60 text-teal-300',
  label: (e) => {
    if (e.kind !== 'skill') return 'fx';
    return `${e.skill}${e.delta >= 0 ? '+' : ''}${String(e.delta)}`;
  },
  defaultState: { skill: '', delta: '0' },
  toFormState: (e) => {
    if (e.kind !== 'skill') return { skill: '', delta: '0' };
    return { skill: e.skill, delta: String(e.delta) };
  },
  buildEffect: (s) => {
    if (!s.skill.trim()) return null;
    return {
      kind: 'skill',
      skill: s.skill.trim(),
      delta: Number(s.delta) || 0,
    };
  },
  Fields: ({ value, onChange }) => (
    <TwoCol>
      <Field>
        <Label>Skill</Label>
        <Input
          value={value.skill}
          onChange={(e) => {
            onChange({ skill: e.target.value });
          }}
          placeholder="Flexibility"
        />
      </Field>
      <NumField
        label="Delta (±)"
        value={value.delta}
        onChange={(v) => {
          onChange({ delta: v });
        }}
      />
    </TwoCol>
  ),
});

export const editorDataRequirements: DataRequirement[] = [{ key: 'items' }];

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    inventory: typeof inventory;
    skill: typeof skill;
  }
}

export default { inventory, skill };

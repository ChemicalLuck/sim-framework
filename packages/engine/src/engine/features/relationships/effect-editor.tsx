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
import { defineEffectEditor } from '@chemicalluck/engine/editor/lib/effect-editor';

import type { RelationshipEffect } from './types';

type Metric = RelationshipEffect['metric'];

interface RelationshipFormState {
  npcId: string;
  metric: Metric;
  delta: string;
}

const relationship = defineEffectEditor<RelationshipFormState>({
  kind: 'relationship',
  color: 'bg-pink-900/60 text-pink-300',
  label: (e) => {
    if (e.kind !== 'relationship') return 'fx';
    return `${e.metric} ${e.delta >= 0 ? '+' : ''}${String(e.delta)}`;
  },
  defaultState: { npcId: '', metric: 'Friendship', delta: '0' },
  toFormState: (e) => {
    if (e.kind !== 'relationship')
      return { npcId: '', metric: 'Friendship', delta: '0' };
    return { npcId: e.npcId, metric: e.metric, delta: String(e.delta) };
  },
  buildEffect: (s) => {
    if (!s.npcId.trim() || !s.metric.trim()) return null;
    return {
      kind: 'relationship',
      npcId: s.npcId.trim(),
      metric: s.metric,
      delta: Number(s.delta) || 0,
    };
  },
  Fields: ({ value, onChange }) => (
    <div className="grid grid-cols-3 gap-2">
      <Field>
        <Label>NPC ID or $npc</Label>
        <Input
          value={value.npcId}
          onChange={(e) => {
            onChange({ npcId: e.target.value });
          }}
          placeholder="$npc"
        />
      </Field>
      <Field>
        <Label>Metric</Label>
        <Select
          value={value.metric}
          onValueChange={(v) => {
            onChange({ metric: v as Metric });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Friendship">Friendship</SelectItem>
            <SelectItem value="Romance">Romance</SelectItem>
            <SelectItem value="Attraction">Attraction</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <Label>Delta (±)</Label>
        <Input
          type="number"
          value={value.delta}
          onChange={(e) => {
            onChange({ delta: e.target.value });
          }}
        />
      </Field>
    </div>
  ),
});

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    relationship: typeof relationship;
  }
}

export default { relationship };

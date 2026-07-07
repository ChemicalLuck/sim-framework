import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import { defineEffectEditor } from '@chemicalluck/sim-engine/editor/lib/effect-editor';

interface NpcFormState {
  npcId: string;
}

const npc = defineEffectEditor<NpcFormState>({
  kind: 'npc',
  color: 'bg-lime-900/60 text-lime-300',
  label: (e) => (e.kind === 'npc' ? `meet:${e.npcId}` : 'fx'),
  defaultState: { npcId: '' },
  toFormState: (e) => ({ npcId: e.kind === 'npc' ? e.npcId : '' }),
  buildEffect: (s) => {
    if (!s.npcId.trim()) return null;
    return { kind: 'npc', npcId: s.npcId.trim(), operation: 'meet' };
  },
  Fields: ({ value, onChange }) => (
    <Field>
      <Label>NPC ID</Label>
      <Input
        value={value.npcId}
        onChange={(e) => {
          onChange({ npcId: e.target.value });
        }}
        placeholder="npc_id"
      />
    </Field>
  ),
});

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    npc: typeof npc;
  }
}

export default { npc };

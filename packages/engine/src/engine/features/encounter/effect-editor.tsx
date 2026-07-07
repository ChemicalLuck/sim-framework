import { Field } from '@chemicalluck/engine/components/ui/field';
import { Input } from '@chemicalluck/engine/components/ui/input';
import { Label } from '@chemicalluck/engine/components/ui/label';
import { IdSelect } from '@chemicalluck/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  type ViewSectionSpec,
  defineEffectEditor,
} from '@chemicalluck/engine/editor/lib/effect-editor';
import type { Effect } from '@chemicalluck/engine/types/effect.types';

interface EncounterFormState {
  encounterId: string;
  npcId: string;
}

const encounter = defineEffectEditor<EncounterFormState>({
  kind: 'encounter',
  color: 'bg-amber-900/60 text-amber-300',
  label: (e) => (e.kind === 'encounter' ? `enc:${e.encounterId}` : 'fx'),
  defaultState: { encounterId: '', npcId: '' },
  toFormState: (e) => {
    if (e.kind !== 'encounter') return { encounterId: '', npcId: '' };
    return { encounterId: e.encounterId, npcId: e.npcId };
  },
  buildEffect: (s) => {
    if (!s.encounterId.trim()) return null;
    return {
      kind: 'encounter',
      encounterId: s.encounterId.trim(),
      npcId: s.npcId.trim(),
    };
  },
  Fields: ({ value, onChange, availableData }) => (
    <>
      <IdSelect
        label="Encounter ID"
        value={value.encounterId}
        onChange={(v) => {
          onChange({ encounterId: v });
        }}
        options={(availableData?.encounters as string[] | undefined) ?? []}
        placeholder="twister"
      />
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
    </>
  ),
});

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    encounter: typeof encounter;
  }
}

export const viewSections: ViewSectionSpec[] = [
  {
    viewId: 'EncounterView',

    getLabel(raw) {
      const id = raw.encounterId;
      return typeof id === 'string' && id ? `→enc:${id}` : null;
    },

    getValues(raw) {
      const encounterId =
        typeof raw.encounterId === 'string' ? raw.encounterId : '';
      return {
        encounterId,
        npcId: encounterId && typeof raw.npcId === 'string' ? raw.npcId : '',
      };
    },

    buildEffect({ encounterId, npcId }) {
      if (!encounterId.trim()) return null;
      return {
        kind: 'view',
        activeViewId: 'EncounterView',
        encounterId: encounterId.trim(),
        npcId: npcId.trim(),
      } as unknown as Effect;
    },

    Fields({ values, onChange, availableData }) {
      return (
        <>
          <IdSelect
            label="Encounter ID"
            value={values.encounterId}
            onChange={(v) => {
              onChange({ ...values, encounterId: v });
            }}
            options={(availableData?.encounters as string[] | undefined) ?? []}
            placeholder="twister"
          />
          <Field>
            <Label>NPC ID</Label>
            <Input
              value={values.npcId}
              onChange={(e) => {
                onChange({ ...values, npcId: e.target.value });
              }}
              placeholder="npc_id"
            />
          </Field>
        </>
      );
    },
  },
];

export const editorDataRequirements: DataRequirement[] = [
  { key: 'encounters' },
];

export default { encounter };

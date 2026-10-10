import { Field } from '@chemicalluck/sim-engine/components/ui/field';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import { IdSelect } from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  type ViewSectionSpec,
  defineEffectEditor,
} from '@chemicalluck/sim-engine/editor/lib/effect-editor';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

/** `"a, b"` → `{ npcId: 'a', npcIds: ['a', 'b'] }` (npcIds only for several). */
function npcFields(raw: string): { npcId: string; npcIds?: string[] } {
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return ids.length > 1
    ? { npcId: ids[0], npcIds: ids }
    : { npcId: ids[0] ?? '' };
}

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
    return {
      encounterId: e.encounterId,
      npcId: (e.npcIds ?? [e.npcId]).join(', '),
    };
  },
  buildEffect: (s) => {
    if (!s.encounterId.trim()) return null;
    return {
      kind: 'encounter',
      encounterId: s.encounterId.trim(),
      ...npcFields(s.npcId),
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
        <Label>NPC IDs (comma-separated, slot order)</Label>
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

declare module '@chemicalluck/sim-engine/editor/lib/effect-editor' {
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
        npcId: !encounterId
          ? ''
          : Array.isArray(raw.npcIds)
            ? raw.npcIds.filter((id) => typeof id === 'string').join(', ')
            : typeof raw.npcId === 'string'
              ? raw.npcId
              : '',
      };
    },

    buildEffect({ encounterId, npcId }) {
      if (!encounterId.trim()) return null;
      return {
        kind: 'view',
        activeViewId: 'EncounterView',
        encounterId: encounterId.trim(),
        ...npcFields(npcId),
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
            <Label>NPC IDs (comma-separated, slot order)</Label>
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

import { IdSelect } from '@sim/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@sim/engine/editor/lib/effect-editor';

interface TravelFormState {
  locationId: string;
}

const travel = defineEffectEditor<TravelFormState>({
  kind: 'travel',
  color: 'bg-cyan-900/60 text-cyan-300',
  label: (e) => (e.kind === 'travel' ? `→${e.newLocationId}` : 'fx'),
  defaultState: { locationId: '' },
  toFormState: (e) => ({
    locationId: e.kind === 'travel' ? e.newLocationId : '',
  }),
  buildEffect: (s) => {
    if (!s.locationId.trim()) return null;
    return { kind: 'travel', newLocationId: s.locationId.trim() };
  },
  Fields: ({ value, onChange, availableData }) => (
    <IdSelect
      label="Location ID"
      value={value.locationId}
      onChange={(v) => {
        onChange({ locationId: v });
      }}
      options={(availableData?.locations as string[] | undefined) ?? []}
      placeholder="bedroom"
    />
  ),
});

export const editorDataRequirements: DataRequirement[] = [{ key: 'locations' }];

declare module '@sim/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    travel: typeof travel;
  }
}

export default { travel };

import { IdSelect } from '@chemicalluck/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@chemicalluck/engine/editor/lib/effect-editor';

interface MilestoneFormState {
  milestoneId: string;
}

const milestone = defineEffectEditor<MilestoneFormState>({
  kind: 'milestone',
  color: 'bg-rose-900/60 text-rose-300',
  label: (e) => (e.kind === 'milestone' ? `ms:${e.milestoneId}` : 'fx'),
  defaultState: { milestoneId: '' },
  toFormState: (e) => ({
    milestoneId: e.kind === 'milestone' ? e.milestoneId : '',
  }),
  buildEffect: (s) => {
    if (!s.milestoneId.trim()) return null;
    return { kind: 'milestone', milestoneId: s.milestoneId.trim() };
  },
  Fields: ({ value, onChange, availableData }) => (
    <IdSelect
      label="Milestone ID"
      value={value.milestoneId}
      onChange={(v) => {
        onChange({ milestoneId: v });
      }}
      options={(availableData?.milestones as string[] | undefined) ?? []}
    />
  ),
});

export const editorDataRequirements: DataRequirement[] = [
  { key: 'milestones' },
];

declare module '@chemicalluck/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    milestone: typeof milestone;
  }
}

export default { milestone };

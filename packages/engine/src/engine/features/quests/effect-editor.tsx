import { Field } from '@sim/engine/components/ui/field';
import { Input } from '@sim/engine/components/ui/input';
import { Label } from '@sim/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import {
  IdSelect,
  TwoCol,
} from '@sim/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@sim/engine/editor/lib/effect-editor';
import { OBJECTIVE_STATES } from '@sim/engine/features/quests/types';

interface QuestFormState {
  questId: string;
  objectiveName: string;
  objectiveState: string;
}

const quest = defineEffectEditor<QuestFormState>({
  kind: 'quest',
  color: 'bg-orange-900/60 text-orange-300',
  label: (e) => (e.kind === 'quest' ? `quest:${e.questId}` : 'fx'),
  defaultState: { questId: '', objectiveName: '', objectiveState: 'complete' },
  toFormState: (e) => {
    if (e.kind !== 'quest')
      return { questId: '', objectiveName: '', objectiveState: 'complete' };
    return {
      questId: e.questId,
      objectiveName: e.objectiveName,
      objectiveState: e.objectiveState,
    };
  },
  buildEffect: (s) => {
    if (!s.questId.trim() || !s.objectiveName.trim()) return null;
    return {
      kind: 'quest',
      questId: s.questId.trim(),
      objectiveName: s.objectiveName.trim(),
      objectiveState: s.objectiveState as 'locked' | 'available' | 'complete',
    };
  },
  Fields: ({ value, onChange, availableData }) => {
    interface QuestEntry {
      id: string;
      objectives: string[];
    }
    const quests = (availableData?.quests as QuestEntry[] | undefined) ?? [];
    return (
      <>
        <TwoCol>
          <IdSelect
            label="Quest ID"
            value={value.questId}
            onChange={(v) => {
              onChange({ questId: v, objectiveName: '' });
            }}
            options={quests.map((q) => q.id)}
          />
          <IdSelect
            label="Objective name"
            value={value.objectiveName}
            onChange={(v) => {
              onChange({ objectiveName: v });
            }}
            options={
              quests.find((q) => q.id === value.questId)?.objectives ?? []
            }
          />
        </TwoCol>
        <Field>
          <Label>New state</Label>
          <Select
            value={value.objectiveState}
            onValueChange={(v) => {
              onChange({ objectiveState: v });
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVE_STATES.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </>
    );
  },
});

interface QuestCreateFormState {
  templateId: string;
  npcId: string;
}

const quest_create = defineEffectEditor<QuestCreateFormState>({
  kind: 'quest_create',
  color: 'bg-orange-900/60 text-orange-300',
  label: (e) => (e.kind === 'quest_create' ? `create:${e.templateId}` : 'fx'),
  defaultState: { templateId: '', npcId: '' },
  toFormState: (e) => {
    if (e.kind !== 'quest_create') return { templateId: '', npcId: '' };
    return { templateId: e.templateId, npcId: e.npcId };
  },
  buildEffect: (s) => {
    if (!s.templateId.trim()) return null;
    return {
      kind: 'quest_create',
      templateId: s.templateId.trim(),
      npcId: s.npcId.trim(),
    };
  },
  Fields: ({ value, onChange, availableData }) => (
    <>
      <IdSelect
        label="Template ID"
        value={value.templateId}
        onChange={(v) => {
          onChange({ templateId: v });
        }}
        options={
          (availableData?.['quest-templates'] as string[] | undefined) ?? []
        }
        placeholder="meet_npc"
      />
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
    </>
  ),
});

export const editorDataRequirements: DataRequirement[] = [
  {
    key: 'quests',
    extract: (raw) => {
      if (!Array.isArray(raw)) return [];
      return raw.map((q) => ({
        id: (q as { id: string }).id,
        objectives: (
          (q as { objectives?: { name: string }[] }).objectives ?? []
        ).map((o) => o.name),
      }));
    },
  },
  { key: 'quest-templates' },
];

declare module '@sim/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    quest: typeof quest;
    quest_create: typeof quest_create;
  }
}

export default { quest, quest_create };

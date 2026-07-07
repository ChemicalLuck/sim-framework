import editorExtensions from 'virtual:editor-extensions';
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
import { IdSelect } from '@sim/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@sim/engine/editor/lib/effect-editor';
import { NPC_VIEW_IDS, VIEW_IDS } from '@sim/engine/features/view/slice';
import type { Effect } from '@sim/engine/types/effect.types';

function getAllViewIds(): string[] {
  return [...VIEW_IDS, ...(editorExtensions.extensionViewIds ?? [])];
}

interface ViewFormState {
  viewId: string;
  npcId: string;
  sceneId: string;
  scriptId: string;
  sectionValues: Record<string, Record<string, string>>;
}

const DEFAULT_STATE: ViewFormState = {
  viewId: 'DefaultView',
  npcId: '',
  sceneId: '',
  scriptId: '',
  sectionValues: {},
};

const view = defineEffectEditor<ViewFormState>({
  kind: 'view',
  color: 'bg-purple-900/60 text-purple-300',
  label: (e) => {
    if (e.kind !== 'view') return 'fx';
    const raw = e as unknown as {
      activeViewId: string;
      sceneId?: string;
      scriptId?: string;
      [key: string]: unknown;
    };
    if (raw.sceneId) return `→scene:${raw.sceneId}`;
    for (const section of editorExtensions.viewSections ?? []) {
      const lbl = section.getLabel(raw);
      if (lbl) return lbl;
    }
    if (raw.scriptId) return `→script:${raw.scriptId}`;
    return `→${raw.activeViewId}`;
  },
  defaultState: DEFAULT_STATE,
  toFormState: (e) => {
    if (e.kind !== 'view') return DEFAULT_STATE;
    const raw = e as unknown as {
      activeViewId: string;
      sceneId?: string;
      scriptId?: string;
      npcId?: string;
      props?: { npcId?: string };
      [key: string]: unknown;
    };
    const sectionValues: Record<string, Record<string, string>> = {};
    for (const section of editorExtensions.viewSections ?? []) {
      sectionValues[section.viewId] = section.getValues(raw);
    }
    return {
      viewId: raw.activeViewId,
      sceneId: raw.sceneId ?? '',
      scriptId: raw.scriptId ?? '',
      npcId: raw.props?.npcId ?? '',
      sectionValues,
    };
  },
  buildEffect: (s) => {
    if (s.viewId === 'SceneView') {
      if (!s.sceneId.trim()) return null;
      return {
        kind: 'view',
        activeViewId: 'SceneView',
        sceneId: s.sceneId.trim(),
      } as unknown as Effect;
    }
    for (const section of editorExtensions.viewSections ?? []) {
      if (s.viewId === section.viewId) {
        return section.buildEffect(s.sectionValues[section.viewId] ?? {});
      }
    }
    if (s.viewId === 'ScriptView') {
      if (!s.scriptId.trim()) return null;
      return {
        kind: 'view',
        activeViewId: 'ScriptView',
        scriptId: s.scriptId.trim(),
      } as unknown as Effect;
    }
    const isNpc = NPC_VIEW_IDS.has(s.viewId as (typeof VIEW_IDS)[number]);
    return {
      kind: 'view',
      activeViewId: s.viewId,
      props: isNpc ? { npcId: s.npcId } : {},
    } as unknown as Effect;
  },
  Fields: ({ value, onChange, availableData }) => (
    <>
      <Field>
        <Label>View</Label>
        <Select
          value={value.viewId}
          onValueChange={(v) => {
            onChange({ viewId: v });
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getAllViewIds().map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {value.viewId === 'SceneView' && (
        <IdSelect
          label="Scene ID"
          value={value.sceneId}
          onChange={(v) => {
            onChange({ sceneId: v });
          }}
          options={(availableData?.scenes as string[] | undefined) ?? []}
          placeholder="sleep"
        />
      )}
      {(editorExtensions.viewSections ?? []).map((section) =>
        value.viewId === section.viewId ? (
          <section.Fields
            key={section.viewId}
            values={value.sectionValues[section.viewId] ?? {}}
            onChange={(patch) => {
              onChange({
                sectionValues: {
                  ...value.sectionValues,
                  [section.viewId]: {
                    ...(value.sectionValues[section.viewId] ?? {}),
                    ...patch,
                  },
                },
              });
            }}
            availableData={availableData}
          />
        ) : null,
      )}
      {value.viewId === 'ScriptView' && (
        <IdSelect
          label="Script ID"
          value={value.scriptId}
          onChange={(v) => {
            onChange({ scriptId: v });
          }}
          options={(availableData?.scripts as string[] | undefined) ?? []}
          placeholder="yoga_class"
        />
      )}
      {NPC_VIEW_IDS.has(value.viewId as (typeof VIEW_IDS)[number]) && (
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
      )}
    </>
  ),
});

export const editorDataRequirements: DataRequirement[] = [
  { key: 'scenes' },
  { key: 'scripts' },
];

declare module '@sim/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    view: typeof view;
  }
}

export default { view };

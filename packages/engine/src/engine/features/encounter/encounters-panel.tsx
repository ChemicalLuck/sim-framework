import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import { Field, FieldGroup } from '@sim/engine/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@sim/engine/components/ui/form';
import { Input } from '@sim/engine/components/ui/input';
import { Label } from '@sim/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import { ConditionField } from '@sim/engine/editor/components/condition-field';
import {
  AddEffectForm,
  EffectChip,
} from '@sim/engine/editor/components/effect-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  InlineEdit,
  PanelLayout,
  SidebarToolbar,
} from '@sim/engine/editor/components/panel-layout';
import { PreviewPane } from '@sim/engine/editor/components/preview/preview-pane';
import { editorTemplateContext } from '@sim/engine/editor/components/template-context';
import { TemplateEditor } from '@sim/engine/editor/components/template-editor';
import { useAddForm } from '@sim/engine/editor/lib/use-add-form';
import type { AvailableData } from '@sim/engine/editor/lib/use-available-data';
import { useAvailableData } from '@sim/engine/editor/lib/use-available-data';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';
import { usePanelEntries } from '@sim/engine/editor/lib/use-panel-entries';
import type { JsonEncounter } from '@sim/engine/features/encounter/authoring.types';
import type {
  Encounter,
  EncounterAction,
  EncounterState,
} from '@sim/engine/features/encounter/types';
import type { Effect } from '@sim/engine/types/effect.types';

// ── Types ─────────────────────────────────────────────────────────

type RawEncounter = Encounter & { id: string };

// ── Add encounter dialog ──────────────────────────────────────────

interface AddEncounterDialogProps {
  onAdd: (encounter: RawEncounter) => void;
}

function AddEncounterDialog({ onAdd }: AddEncounterDialogProps) {
  const { form, submit } = useAddForm({ id: '', name: '' }, ({ id, name }) => {
    const initialState: EncounterState = {
      id: 'default',
      name: 'Default',
      text: '',
      actions: [],
    };
    onAdd({
      kind: 'encounter',
      id: id.trim(),
      name: name.trim(),
      states: [initialState],
      initialStateId: 'default',
    });
  });

  return (
    <AddDialog
      label="New Encounter"
      onSubmit={submit}
      canSubmit={!!form.watch('id').trim() && !!form.watch('name').trim()}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="twister" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Twister" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Encounter action editor ───────────────────────────────────────

interface EncounterActionRowProps {
  action: EncounterAction;
  bodyParts: string[];
  stateIds: string[];
  onChange: (updated: EncounterAction) => void;
  onRemove: () => void;
  availableData: AvailableData;
}

function EncounterActionRow({
  action,
  bodyParts,
  stateIds,
  onChange,
  onRemove,
  availableData,
}: EncounterActionRowProps) {
  const [showAddEffect, setShowAddEffect] = useState(false);
  const [editingEffectIdx, setEditingEffectIdx] = useState<number | null>(null);
  const effects = action.effects ?? [];

  function addEffect(effect: Effect) {
    onChange({ ...action, effects: [...effects, effect] });
    setShowAddEffect(false);
  }

  function removeEffect(idx: number) {
    if (editingEffectIdx === idx) setEditingEffectIdx(null);
    onChange({ ...action, effects: effects.filter((_, i) => i !== idx) });
  }

  function replaceEffect(idx: number, effect: Effect) {
    onChange({
      ...action,
      effects: effects.map((e, i) => (i === idx ? effect : e)),
    });
  }

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden mb-2">
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-2 bg-zinc-800">
        <div className="flex-1 min-w-0">
          <TemplateEditor
            value={action.text}
            onChange={(v) => {
              onChange({ ...action, text: v });
            }}
            context={editorTemplateContext()}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
        >
          <X size={12} />
        </Button>
      </div>

      {/* Fields */}
      <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-700/50 space-y-2">
        {/* Body part + ID row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-zinc-500 mb-1 block">ID</Label>
            <Input
              value={action.id}
              onChange={(e) => {
                onChange({ ...action, id: e.target.value });
              }}
              className="h-7 text-xs bg-zinc-800 border-zinc-600"
              placeholder="action_id"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-zinc-500 mb-1 block">
              Body part
            </Label>
            {bodyParts.length > 0 ? (
              <Select
                value={action.bodyPart || '__none__'}
                onValueChange={(v) => {
                  onChange({ ...action, bodyPart: v === '__none__' ? '' : v });
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="h-7 text-xs bg-zinc-800 border-zinc-600"
                >
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— none —</SelectItem>
                  {bodyParts.map((bp) => (
                    <SelectItem key={bp} value={bp}>
                      {bp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={action.bodyPart}
                onChange={(e) => {
                  onChange({ ...action, bodyPart: e.target.value });
                }}
                className="h-7 text-xs bg-zinc-800 border-zinc-600"
                placeholder="Right Hand"
              />
            )}
          </div>
        </div>

        {/* Transition + NPC weight */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-zinc-500 mb-1 block">
              Activate → state
            </Label>
            <Select
              value={action.activateTransition ?? '__none__'}
              onValueChange={(v) => {
                onChange({
                  ...action,
                  activateTransition: v === '__none__' ? undefined : v,
                });
              }}
            >
              <SelectTrigger
                size="sm"
                className="h-7 text-xs bg-zinc-800 border-zinc-600"
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— none —</SelectItem>
                {stateIds.map((sid) => (
                  <SelectItem key={sid} value={sid}>
                    {sid}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Label className="text-xs text-zinc-500 mb-1 block">
              NPC weight
            </Label>
            <Input
              type="number"
              value={action.npcWeight ?? 1}
              onChange={(e) => {
                onChange({
                  ...action,
                  npcWeight: parseFloat(e.target.value) || 1,
                });
              }}
              className="h-7 text-xs bg-zinc-800 border-zinc-600"
              min={0}
              step={0.1}
            />
          </div>
        </div>

        {/* Effects */}
        <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
          {/* eslint-disable react-x/no-array-index-key */}
          {effects.map((eff, i) => (
            <EffectChip
              key={i}
              effect={eff}
              onRemove={() => {
                removeEffect(i);
              }}
              onClick={() => {
                setShowAddEffect(false);
                setEditingEffectIdx(i);
              }}
            />
          ))}
          {/* eslint-enable react-x/no-array-index-key */}
          {!showAddEffect && editingEffectIdx == null && (
            <Button
              onClick={() => {
                setShowAddEffect(true);
              }}
              size="sm"
              variant="ghost"
            >
              <Plus size={12} /> effect
            </Button>
          )}
        </div>
        {showAddEffect && (
          <AddEffectForm
            onAdd={addEffect}
            onCancel={() => {
              setShowAddEffect(false);
            }}
            availableData={availableData}
          />
        )}
        {editingEffectIdx != null && effects[editingEffectIdx] && (
          <AddEffectForm
            initial={effects[editingEffectIdx]}
            onAdd={(eff) => {
              replaceEffect(editingEffectIdx, eff);
              setEditingEffectIdx(null);
            }}
            onCancel={() => {
              setEditingEffectIdx(null);
            }}
            availableData={availableData}
          />
        )}

        {/* NPC skill weights */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-zinc-500">NPC skill weights</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-1 text-zinc-600 hover:text-zinc-300"
              onClick={() => {
                const key = prompt('Skill name:');
                if (!key?.trim()) return;
                onChange({
                  ...action,
                  npcSkillWeights: {
                    ...(action.npcSkillWeights ?? {}),
                    [key.trim()]: 1,
                  },
                });
              }}
            >
              <Plus size={10} /> add
            </Button>
          </div>
          {Object.entries(action.npcSkillWeights ?? {}).map(([skill, w]) => (
            <div key={skill} className="flex items-center gap-1 mb-1">
              <span className="text-xs text-zinc-400 flex-1 truncate">
                {skill}
              </span>
              <Input
                type="number"
                value={w}
                onChange={(e) => {
                  onChange({
                    ...action,
                    npcSkillWeights: {
                      ...(action.npcSkillWeights ?? {}),
                      [skill]: parseFloat(e.target.value) || 1,
                    },
                  });
                }}
                className="h-6 text-xs w-16 bg-zinc-800 border-zinc-600"
                min={0}
                step={0.1}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                onClick={() => {
                  const next = Object.fromEntries(
                    Object.entries(action.npcSkillWeights ?? {}).filter(
                      ([k]) => k !== skill,
                    ),
                  );
                  onChange({
                    ...action,
                    npcSkillWeights: Object.keys(next).length
                      ? next
                      : undefined,
                  });
                }}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
        </div>

        {/* NPC trait weights */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-zinc-500">NPC trait weights</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-1 text-zinc-600 hover:text-zinc-300"
              onClick={() => {
                const key = prompt('Trait name (e.g. Extroverted):');
                if (!key?.trim()) return;
                onChange({
                  ...action,
                  npcTraitWeights: {
                    ...(action.npcTraitWeights ?? {}),
                    [key.trim()]: 1,
                  },
                });
              }}
            >
              <Plus size={10} /> add
            </Button>
          </div>
          {Object.entries(action.npcTraitWeights ?? {}).map(([trait, w]) => (
            <div key={trait} className="flex items-center gap-1 mb-1">
              <span className="text-xs text-zinc-400 flex-1 truncate">
                {trait}
              </span>
              <Input
                type="number"
                value={w}
                onChange={(e) => {
                  onChange({
                    ...action,
                    npcTraitWeights: {
                      ...(action.npcTraitWeights ?? {}),
                      [trait]: parseFloat(e.target.value) || 1,
                    },
                  });
                }}
                className="h-6 text-xs w-16 bg-zinc-800 border-zinc-600"
                min={0}
                step={0.1}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                onClick={() => {
                  const next = Object.fromEntries(
                    Object.entries(action.npcTraitWeights ?? {}).filter(
                      ([k]) => k !== trait,
                    ),
                  );
                  onChange({
                    ...action,
                    npcTraitWeights: Object.keys(next).length
                      ? next
                      : undefined,
                  });
                }}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
        </div>

        {/* Condition */}
        <div className="border-t border-zinc-700/30 pt-1.5">
          <ConditionField
            condition={action.condition}
            onChange={(c) => {
              onChange({ ...action, condition: c });
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── State editor ──────────────────────────────────────────────────

interface StateEditorProps {
  state: EncounterState;
  allStateIds: string[];
  bodyParts: string[];
  onChange: (updated: EncounterState) => void;
  onRemove: () => void;
  availableData: AvailableData;
}

function StateEditor({
  state,
  allStateIds,
  bodyParts,
  onChange,
  onRemove,
  availableData,
}: StateEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const otherStateIds = allStateIds.filter((id) => id !== state.id);

  function addAction() {
    const newAction: EncounterAction = {
      id: `action_${Date.now().toString()}`,
      text: 'New action',
      bodyPart: bodyParts[0] ?? '',
    };
    onChange({ ...state, actions: [...state.actions, newAction] });
  }

  return (
    <div className="border border-zinc-600 rounded-md overflow-hidden mb-3">
      {/* State header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-700">
        <button
          className="flex-1 text-left text-sm font-medium text-zinc-100"
          onClick={() => {
            setCollapsed((c) => !c);
          }}
        >
          {collapsed ? '▶' : '▼'} {state.name}{' '}
          <span className="text-zinc-400 font-normal text-xs">
            ({state.id})
          </span>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400 shrink-0"
        >
          <Trash2 size={12} />
        </Button>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-3 bg-zinc-850">
          {/* Name + ID */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-zinc-500 mb-1 block">ID</Label>
              <Input
                value={state.id}
                onChange={(e) => {
                  onChange({ ...state, id: e.target.value });
                }}
                className="h-7 text-xs"
                placeholder="state_id"
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-zinc-500 mb-1 block">Name</Label>
              <Input
                value={state.name}
                onChange={(e) => {
                  onChange({ ...state, name: e.target.value });
                }}
                className="h-7 text-xs"
                placeholder="Display name"
              />
            </div>
          </div>

          {/* Text */}
          <div>
            <Label className="text-xs text-zinc-500 mb-1 block">
              Text (supports {'{npc0.firstName}'} tokens)
            </Label>
            <TemplateEditor
              value={state.text}
              onChange={(v) => {
                onChange({ ...state, text: v });
              }}
              context={editorTemplateContext()}
            />
          </div>

          {/* Auto-transition */}
          {otherStateIds.length > 0 && (
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-zinc-500 mb-1 block">
                  Auto-transition → state (when condition met)
                </Label>
                <Select
                  value={state.transitionTo ?? '__none__'}
                  onValueChange={(v) => {
                    onChange({
                      ...state,
                      transitionTo: v === '__none__' ? undefined : v,
                      condition: v === '__none__' ? undefined : state.condition,
                    });
                  }}
                >
                  <SelectTrigger size="sm" className="h-7 text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— none —</SelectItem>
                    {otherStateIds.map((sid) => (
                      <SelectItem key={sid} value={sid}>
                        {sid}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.transitionTo && (
                <div>
                  <Label className="text-xs text-zinc-500 mb-1 block">
                    Transition condition
                  </Label>
                  <ConditionField
                    condition={state.condition}
                    onChange={(c) => {
                      onChange({ ...state, condition: c });
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-zinc-400">
                Actions ({state.actions.length})
              </Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={addAction}
                className="h-6 text-xs px-2"
              >
                <Plus size={10} /> action
              </Button>
            </div>
            {state.actions.map((action, idx) => (
              <EncounterActionRow
                key={action.id}
                action={action}
                bodyParts={bodyParts}
                stateIds={allStateIds}
                onChange={(updated) => {
                  onChange({
                    ...state,
                    actions: state.actions.map((a, i) =>
                      i === idx ? updated : a,
                    ),
                  });
                }}
                onRemove={() => {
                  onChange({
                    ...state,
                    actions: state.actions.filter((_, i) => i !== idx),
                  });
                }}
                availableData={availableData}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Encounter detail ──────────────────────────────────────────────

interface EncounterDetailProps {
  encounter: RawEncounter;
  bodyParts: string[];
  onChange: (updated: RawEncounter) => void;
  availableData: AvailableData;
}

function EncounterDetail({
  encounter,
  bodyParts,
  onChange,
  availableData,
}: EncounterDetailProps) {
  const [showAddStopEffect, setShowAddStopEffect] = useState(false);
  const stopEffects = encounter.stopEffects ?? [];
  const stateIds = encounter.states.map((s) => s.id);

  function addState() {
    const newState: EncounterState = {
      id: `state_${Date.now().toString()}`,
      name: 'New State',
      text: '',
      actions: [],
    };
    onChange({ ...encounter, states: [...encounter.states, newState] });
  }

  function addStopEffect(effect: Effect) {
    onChange({
      ...encounter,
      stopEffects: [...stopEffects, effect],
    });
    setShowAddStopEffect(false);
  }

  function removeStopEffect(idx: number) {
    onChange({
      ...encounter,
      stopEffects: stopEffects.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-4">
      {/* Core fields */}
      <FieldGroup>
        <div className="flex gap-3">
          <Field className="flex-1">
            <Label>Name</Label>
            <InlineEdit
              value={encounter.name}
              onCommit={(name) => {
                onChange({ ...encounter, name });
              }}
              placeholder="Encounter name"
            />
          </Field>
          <Field className="w-32">
            <Label>NPC idle weight</Label>
            <Input
              type="number"
              value={encounter.npcDoNothingWeight ?? 1}
              onChange={(e) => {
                onChange({
                  ...encounter,
                  npcDoNothingWeight: parseFloat(e.target.value) || 1,
                });
              }}
              className="h-8 text-sm"
              min={0}
              step={0.1}
            />
          </Field>
        </div>

        {/* Initial state */}
        <Field>
          <Label>Initial state</Label>
          <Select
            value={encounter.initialStateId}
            onValueChange={(v) => {
              onChange({ ...encounter, initialStateId: v });
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stateIds.map((sid) => (
                <SelectItem key={sid} value={sid}>
                  {sid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      {/* NPC needs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>NPC needs (transient)</Label>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={() => {
              const key = prompt('Need name (e.g. Energy):');
              if (!key?.trim()) return;
              onChange({
                ...encounter,
                npcNeeds: { ...(encounter.npcNeeds ?? {}), [key.trim()]: 100 },
              });
            }}
          >
            <Plus size={10} /> need
          </Button>
        </div>
        <div className="space-y-1">
          {Object.entries(encounter.npcNeeds ?? {}).map(([need, value]) => (
            <div key={need} className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 w-24">{need}</span>
              <Input
                type="number"
                value={value}
                onChange={(e) => {
                  onChange({
                    ...encounter,
                    npcNeeds: {
                      ...(encounter.npcNeeds ?? {}),
                      [need]: parseFloat(e.target.value) || 0,
                    },
                  });
                }}
                className="h-6 text-xs w-20"
                min={0}
                max={100}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
                onClick={() => {
                  const next = Object.fromEntries(
                    Object.entries(encounter.npcNeeds ?? {}).filter(
                      ([k]) => k !== need,
                    ),
                  );
                  onChange({
                    ...encounter,
                    npcNeeds: Object.keys(next).length ? next : undefined,
                  });
                }}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
          {!Object.keys(encounter.npcNeeds ?? {}).length && (
            <p className="text-xs text-zinc-600 italic">
              No NPC needs defined.
            </p>
          )}
        </div>
      </div>

      {/* Stop effects */}
      <div>
        <Label className="mb-2 block">Stop effects</Label>
        <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
          {/* eslint-disable react-x/no-array-index-key */}
          {stopEffects.map((eff, i) => (
            <EffectChip
              key={i}
              effect={eff}
              onRemove={() => {
                removeStopEffect(i);
              }}
            />
          ))}
          {/* eslint-enable react-x/no-array-index-key */}
          {!showAddStopEffect && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddStopEffect(true);
              }}
            >
              <Plus size={12} /> effect
            </Button>
          )}
        </div>
        {showAddStopEffect && (
          <AddEffectForm
            onAdd={addStopEffect}
            onCancel={() => {
              setShowAddStopEffect(false);
            }}
            availableData={availableData}
          />
        )}
      </div>

      {/* States */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>States ({encounter.states.length})</Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={addState}
            className="h-7 text-xs px-2"
          >
            <Plus size={12} /> state
          </Button>
        </div>
        {encounter.states.map((state, idx) => (
          <StateEditor
            key={state.id}
            state={state}
            allStateIds={stateIds}
            bodyParts={bodyParts}
            onChange={(updated) => {
              // If state ID changed, update initialStateId references
              const updatedStates = encounter.states.map((s, i) =>
                i === idx ? updated : s,
              );
              const idChanged = updated.id !== state.id;
              onChange({
                ...encounter,
                states: updatedStates,
                initialStateId:
                  idChanged && encounter.initialStateId === state.id
                    ? updated.id
                    : encounter.initialStateId,
              });
            }}
            onRemove={() => {
              onChange({
                ...encounter,
                states: encounter.states.filter((_, i) => i !== idx),
              });
            }}
            availableData={availableData}
          />
        ))}
      </div>

      <PreviewPane
        kind="encounter"
        encounter={encounter as unknown as JsonEncounter}
      />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────

export function EncountersPanel() {
  const {
    items: encounters,
    ids: encounterIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange: changeEncounter,
    handleAdd: addEncounter,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawEncounter>({ saveMessage: 'Encounters saved' });

  const { data: playerCfg } = useEditorData<{ bodyParts?: string[] }>(
    '/editor/api/data/player',
  );
  const bodyParts = playerCfg.bodyParts ?? [];

  const [search, setSearch] = useState('');
  const availableData = useAvailableData();

  const q = search.trim().toLowerCase();
  const filtered = (
    q
      ? encounterIds.filter(
          (id) =>
            id.toLowerCase().includes(q) ||
            encounters[id].name.toLowerCase().includes(q),
        )
      : encounterIds
  ).map((id) => encounters[id]);

  function handleAddEncounter(encounter: RawEncounter) {
    addEncounter(encounter);
    setSelected(encounter.id);
  }

  function updateEncounter(updated: RawEncounter) {
    changeEncounter(updated.id, updated);
  }

  const selectedEncounter = selected ? encounters[selected] : null;

  return (
    <PanelLayout
      sidebarWidth="w-56"
      sidebar={
        <>
          <SidebarToolbar
            add={<AddEncounterDialog onAdd={handleAddEncounter} />}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search encounters…"
            count={filtered.length}
            total={encounterIds.length}
          />
          <DataList
            items={filtered}
            getKey={(e) => e.id}
            selected={selected}
            onSelect={(id) => {
              confirmSelect(() => {
                setSelected(id);
              });
            }}
            allKeys={encounterIds}
            onClone={(e, newId) => handleClone(e.id, newId)}
            onDelete={(e) => {
              handleDelete(e.id);
            }}
            getReferences={(e) => referencesFor(e.id)}
            renderItem={(e) => (
              <div>
                <div className="text-sm">{e.name}</div>
                <div className="text-xs text-zinc-500">{e.id}</div>
              </div>
            )}
          />
        </>
      }
      entityId={selected ?? undefined}
      onRename={
        selected
          ? (newId) => {
              void rename(selected, newId);
            }
          : undefined
      }
      references={selected ? referencesFor(selected) : undefined}
    >
      {selected && selectedEncounter ? (
        <>
          <h2 className="text-sm font-medium text-zinc-100 mb-3">
            {selectedEncounter.name}{' '}
            <span className="text-zinc-500 font-normal">
              ({selectedEncounter.id})
            </span>
          </h2>
          <EncounterDetail
            key={selected}
            encounter={selectedEncounter}
            bodyParts={bodyParts}
            onChange={updateEncounter}
            availableData={availableData}
          />
        </>
      ) : (
        <p className="text-sm text-zinc-500 italic">
          Select an encounter from the list or create a new one.
        </p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching encounters will discard them."
      />
    </PanelLayout>
  );
}

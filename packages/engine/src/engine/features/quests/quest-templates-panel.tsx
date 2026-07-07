import { Pencil, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Field, FieldGroup } from '@chemicalluck/sim-engine/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@chemicalluck/sim-engine/components/ui/form';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import { ConditionEditor } from '@chemicalluck/sim-engine/editor/components/condition-form';
import {
  AddEffectForm,
  EffectChip,
} from '@chemicalluck/sim-engine/editor/components/effect-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/sim-engine/editor/components/panel-layout';
import { PreviewPane } from '@chemicalluck/sim-engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@chemicalluck/sim-engine/editor/components/referenced-by';
import { conditionToString } from '@chemicalluck/sim-engine/editor/lib/condition-utils';
import { useAddForm } from '@chemicalluck/sim-engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import {
  type ObjectiveState,
  type QuestObjectiveTemplate,
  type QuestTemplate,
} from '@chemicalluck/sim-engine/features/quests/types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

// ── State cycling ────────────────────────────────────────────────

const STATE_COLORS: Record<ObjectiveState, string> = {
  locked: 'bg-zinc-700 text-zinc-400',
  available: 'bg-blue-900 text-blue-300',
  complete: 'bg-green-900 text-green-300',
};

const STATE_ORDER: ObjectiveState[] = ['locked', 'available', 'complete'];

// ── Objective row ────────────────────────────────────────────────

interface ObjectiveRowProps {
  objective: QuestObjectiveTemplate;
  onChange: (updated: QuestObjectiveTemplate) => void;
  onRemove: () => void;
}

function ObjectiveRow({ objective, onChange, onRemove }: ObjectiveRowProps) {
  const [editingCond, setEditingCond] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(false);
  const [addingEffect, setAddingEffect] = useState(false);
  const availableData = useAvailableData();

  function cycleState() {
    const idx = STATE_ORDER.indexOf(objective.state);
    const next = STATE_ORDER[(idx + 1) % STATE_ORDER.length];
    onChange({ ...objective, state: next });
  }

  const condText =
    'kind' in objective.condition
      ? conditionToString(objective.condition as Condition)
      : typeof objective.condition === 'object'
        ? JSON.stringify(objective.condition)
        : '';

  const triggerText = objective.trigger
    ? conditionToString(objective.trigger as Condition)
    : '';

  const showTriggerSection =
    objective.state === 'locked' || !!objective.trigger;

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800">
        <button
          onClick={cycleState}
          title="Click to cycle state"
          className={`text-xs px-1.5 py-0.5 rounded shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${STATE_COLORS[objective.state]}`}
        >
          {objective.state}
        </button>

        <Input
          value={objective.name}
          onChange={(e) => {
            onChange({ ...objective, name: e.target.value });
          }}
          className="flex-1 h-7 text-sm bg-zinc-700 border-zinc-600"
          placeholder="Objective name…"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
          title="Remove objective"
        >
          <X size={12} />
        </Button>
      </div>

      <div className="px-3 py-2 border-t border-zinc-700/50 bg-zinc-900 space-y-2">
        {!editingCond && (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-zinc-400 truncate">
              {condText || '—'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingCond(true);
              }}
              className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
              title="Edit condition"
            >
              <Pencil size={12} /> condition
            </Button>
          </div>
        )}
        {editingCond && (
          <ConditionEditor
            initial={
              'kind' in objective.condition
                ? (objective.condition as Condition)
                : undefined
            }
            onSave={(c) => {
              onChange({ ...objective, condition: c });
              setEditingCond(false);
            }}
            onCancel={() => {
              setEditingCond(false);
            }}
          />
        )}

        {showTriggerSection && (
          <div className="pt-1 border-t border-zinc-800">
            {!editingTrigger && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 shrink-0">trigger</span>
                <p className="flex-1 text-xs text-zinc-400 truncate font-mono">
                  {triggerText || '—'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTrigger(true);
                  }}
                  className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
                  title={objective.trigger ? 'Edit trigger' : 'Set trigger'}
                >
                  <Pencil size={12} />{' '}
                  {objective.trigger ? 'trigger' : 'set trigger'}
                </Button>
                {objective.trigger && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange({ ...objective, trigger: undefined });
                    }}
                    className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
                    title="Remove trigger"
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>
            )}
            {editingTrigger && (
              <ConditionEditor
                initial={
                  objective.trigger && 'kind' in objective.trigger
                    ? (objective.trigger as Condition)
                    : undefined
                }
                onSave={(c) => {
                  onChange({ ...objective, trigger: c });
                  setEditingTrigger(false);
                }}
                onCancel={() => {
                  setEditingTrigger(false);
                }}
              />
            )}
          </div>
        )}

        <div className="pt-1 border-t border-zinc-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-500 shrink-0">on complete</span>
            <div className="flex flex-wrap gap-1 flex-1">
              {(objective.onComplete ?? []).map((effect, i) => (
                <EffectChip
                  // eslint-disable-next-line react-x/no-array-index-key
                  key={i}
                  effect={effect}
                  onRemove={() => {
                    const next = (objective.onComplete ?? []).filter(
                      (_, idx) => idx !== i,
                    );
                    onChange({
                      ...objective,
                      onComplete: next.length ? next : undefined,
                    });
                  }}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingEffect(true);
              }}
              className="h-6 text-xs text-zinc-600 hover:text-zinc-300 shrink-0"
            >
              <Plus size={12} /> add
            </Button>
          </div>
          {addingEffect && (
            <AddEffectForm
              onAdd={(effect: Effect) => {
                onChange({
                  ...objective,
                  onComplete: [...(objective.onComplete ?? []), effect],
                });
                setAddingEffect(false);
              }}
              onCancel={() => {
                setAddingEffect(false);
              }}
              availableData={availableData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Objective form ───────────────────────────────────────────

interface AddObjectiveFormProps {
  onAdd: (obj: QuestObjectiveTemplate) => void;
  onCancel: () => void;
}

function AddObjectiveForm({ onAdd, onCancel }: AddObjectiveFormProps) {
  const form = useForm<{ name: string; state: ObjectiveState }>({
    defaultValues: { name: '', state: 'available' },
  });
  const [condition, setCondition] = useState<Condition | null>(null);
  const [showCondForm, setShowCondForm] = useState(false);
  const [trigger, setTrigger] = useState<Condition | null>(null);
  const [showTriggerForm, setShowTriggerForm] = useState(false);

  const watchedState = form.watch('state');

  function submit() {
    void form.handleSubmit(({ name, state }) => {
      if (!condition) return;
      onAdd({
        name: name.trim(),
        state,
        condition,
        ...(trigger ? { trigger } : {}),
      });
    })();
  }

  return (
    <Form {...form}>
      <div className="border border-zinc-600 rounded-md p-3 space-y-3 bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">New Objective</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0 text-zinc-500 hover:text-white"
          >
            <X size={12} />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label className="text-xs text-zinc-500">
              Name (supports {'{npc0.firstName}'})
            </Label>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Meet {npc0.firstName}"
                    className="h-7 text-xs bg-zinc-800 border-zinc-600 w-full"
                    autoFocus
                  />
                </FormControl>
              )}
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs text-zinc-500">Initial state</Label>
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    size="sm"
                    className="w-full bg-zinc-800 border-zinc-600 h-7 text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATE_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-zinc-500">Condition</Label>
            {condition && (
              <span className="text-xs text-zinc-400 truncate flex-1 font-mono">
                {conditionToString(condition)}
              </span>
            )}
            {!showCondForm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCondForm(true);
                }}
                className="h-6 text-xs text-zinc-500 hover:text-zinc-300 ml-auto"
              >
                {condition ? (
                  <>
                    <Pencil size={12} /> edit
                  </>
                ) : (
                  <>
                    <Plus size={12} /> set condition
                  </>
                )}
              </Button>
            )}
          </div>
          {showCondForm && (
            <ConditionEditor
              initial={condition ?? undefined}
              onSave={(c) => {
                setCondition(c);
                setShowCondForm(false);
              }}
              onCancel={() => {
                setShowCondForm(false);
              }}
            />
          )}
        </div>

        {watchedState === 'locked' && (
          <div className="space-y-1 border-t border-zinc-700/50 pt-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-zinc-500">
                Trigger{' '}
                <span className="text-zinc-600">
                  (optional — unlocks this objective)
                </span>
              </Label>
              {trigger && (
                <span className="text-xs text-zinc-400 truncate flex-1 font-mono">
                  {conditionToString(trigger)}
                </span>
              )}
              {!showTriggerForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTriggerForm(true);
                  }}
                  className="h-6 text-xs text-zinc-500 hover:text-zinc-300 ml-auto"
                >
                  {trigger ? (
                    <>
                      <Pencil size={12} /> edit
                    </>
                  ) : (
                    <>
                      <Plus size={12} /> set trigger
                    </>
                  )}
                </Button>
              )}
              {trigger && !showTriggerForm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTrigger(null);
                  }}
                  className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400"
                  title="Remove trigger"
                >
                  <X size={12} />
                </Button>
              )}
            </div>
            {showTriggerForm && (
              <ConditionEditor
                initial={trigger ?? undefined}
                onSave={(c) => {
                  setTrigger(c);
                  setShowTriggerForm(false);
                }}
                onCancel={() => {
                  setShowTriggerForm(false);
                }}
              />
            )}
          </div>
        )}

        <Button
          size="sm"
          onClick={submit}
          disabled={!form.watch('name').trim() || !condition}
          className="h-7 text-xs"
        >
          Add Objective
        </Button>
      </div>
    </Form>
  );
}

// ── Add Template dialog ──────────────────────────────────────────

interface AddQuestTemplateDialogProps {
  onAdd: (template: QuestTemplate) => void;
}

function AddQuestTemplateDialog({ onAdd }: AddQuestTemplateDialogProps) {
  const { form, submit } = useAddForm(
    { id: '', idTemplate: '', name: '' },
    ({ id, idTemplate, name }) => {
      onAdd({
        id: id.trim(),
        idTemplate: idTemplate.trim(),
        name: name.trim(),
        objectives: [],
      });
    },
  );

  const canSubmit =
    !!form.watch('id').trim() &&
    !!form.watch('idTemplate').trim() &&
    !!form.watch('name').trim();

  return (
    <AddDialog label="New Template" onSubmit={submit} canSubmit={canSubmit}>
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="meet_npc" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Template</FormLabel>
              <FormControl>
                <Input {...field} placeholder="meet_{npc0.id}" />
              </FormControl>
              {field.value && !field.value.includes('{{') && (
                <p className="text-xs text-amber-500">
                  No {'{{...}}'} token — all instances will share the same ID.
                </p>
              )}
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
                <Input {...field} placeholder="Meet {npc0.firstName}" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Template detail ──────────────────────────────────────────────

interface QuestTemplateDetailProps {
  template: QuestTemplate;
  onChange: (updated: QuestTemplate) => void;
  refs: string[];
}

function QuestTemplateDetail({
  template,
  onChange,
  refs,
}: QuestTemplateDetailProps) {
  const [showAddObj, setShowAddObj] = useState(false);

  function handleObjectiveChange(idx: number, updated: QuestObjectiveTemplate) {
    onChange({
      ...template,
      objectives: template.objectives.map((o, i) => (i === idx ? updated : o)),
    });
  }

  function handleObjectiveRemove(idx: number) {
    onChange({
      ...template,
      objectives: template.objectives.filter((_, i) => i !== idx),
    });
  }

  function handleObjectiveAdd(obj: QuestObjectiveTemplate) {
    onChange({ ...template, objectives: [...template.objectives, obj] });
    setShowAddObj(false);
  }

  return (
    <FieldGroup>
      <Field>
        <Input
          value={template.name}
          onChange={(e) => {
            onChange({ ...template, name: e.target.value });
          }}
          className="h-8 text-base font-medium bg-zinc-800 border-zinc-600"
          placeholder="Template name…"
        />
      </Field>

      <ReferencedBy refs={refs} />

      <Field>
        <Label>ID Template</Label>
        <p className="text-xs text-zinc-500 mb-1">
          Resolves to the runtime quest ID. Supports <code>{'{npc0.id}'}</code>,{' '}
          <code>{'{npc0.firstName}'}</code>, <code>{'{npc0.lastName}'}</code>.
        </p>
        <Input
          value={template.idTemplate}
          onChange={(e) => {
            onChange({ ...template, idTemplate: e.target.value });
          }}
          className="h-8 text-sm bg-zinc-800 border-zinc-600 font-mono"
          placeholder="meet_{npc0.id}"
        />
        {template.idTemplate && !template.idTemplate.includes('{{') && (
          <p className="text-xs text-amber-500 mt-1">
            No {'{{...}}'} token — all instances will share the same ID.
          </p>
        )}
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Objectives ({template.objectives.length})
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAddObj((v) => !v);
            }}
            className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {showAddObj ? '— cancel' : '+ Add objective'}
          </Button>
        </div>
        {template.objectives.map((obj, i) => (
          <ObjectiveRow
            // eslint-disable-next-line
            key={i}
            objective={obj}
            onChange={(updated) => {
              handleObjectiveChange(i, updated);
            }}
            onRemove={() => {
              handleObjectiveRemove(i);
            }}
          />
        ))}
        {template.objectives.length === 0 && !showAddObj && (
          <p className="text-xs text-zinc-600 italic">No objectives yet.</p>
        )}
        {showAddObj && (
          <AddObjectiveForm
            onAdd={handleObjectiveAdd}
            onCancel={() => {
              setShowAddObj(false);
            }}
          />
        )}
      </Field>

      <PreviewPane kind="questTemplate" template={template} />
    </FieldGroup>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function QuestTemplatesPanel() {
  const {
    items: templates,
    ids: templateIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<QuestTemplate>({ saveMessage: 'Templates saved' });
  const [search, setSearch] = useState('');

  function handleTemplateAdd(template: QuestTemplate) {
    handleAdd(template);
    setSelected(template.id);
  }

  const q = search.trim().toLowerCase();
  const allTemplates = Object.values(templates);
  const filteredTemplates = q
    ? allTemplates.filter(
        (t) =>
          t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
      )
    : allTemplates;

  const activeTemplate = selected ? templates[selected] : null;

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddQuestTemplateDialog onAdd={handleTemplateAdd} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search templates..."
        count={filteredTemplates.length}
        total={templateIds.length}
      />
      <DataList
        items={filteredTemplates}
        getKey={(t) => t.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={templateIds}
        onClone={(t, newId) => handleClone(t.id, newId)}
        onDelete={(t) => {
          handleDelete(t.id);
        }}
        getReferences={(t) => referencesFor(t.id)}
        renderItem={(t) => (
          <>
            <p className="text-sm truncate">{t.name}</p>
            <p className="text-xs text-zinc-500 truncate">{t.id}</p>
          </>
        )}
        emptyText="No templates match."
      />
    </>
  );

  return (
    <PanelLayout
      sidebar={sidebar}
      entityId={activeTemplate?.id ?? undefined}
      onRename={
        selected
          ? (newId) => {
              void rename(selected, newId);
            }
          : undefined
      }
      references={selected ? referencesFor(selected) : undefined}
    >
      {activeTemplate ? (
        <QuestTemplateDetail
          key={activeTemplate.id}
          template={activeTemplate}
          onChange={(updated) => {
            handleChange(updated.id, updated);
          }}
          refs={referencesFor(activeTemplate.id)}
        />
      ) : (
        <p className="text-zinc-500 text-sm">
          Select a template or create a new one.
        </p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching templates will discard them."
      />
    </PanelLayout>
  );
}

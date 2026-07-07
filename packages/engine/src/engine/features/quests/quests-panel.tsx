import { Pencil, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { Field, FieldGroup } from '@chemicalluck/engine/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@chemicalluck/engine/components/ui/form';
import { Input } from '@chemicalluck/engine/components/ui/input';
import { Label } from '@chemicalluck/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';
import { ConditionEditor } from '@chemicalluck/engine/editor/components/condition-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/engine/editor/components/panel-layout';
import { PreviewPane } from '@chemicalluck/engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@chemicalluck/engine/editor/components/referenced-by';
import {
  diffObjectiveRenames,
  patchObjectiveRenames,
} from '@chemicalluck/engine/editor/lib/cascade';
import { conditionToString } from '@chemicalluck/engine/editor/lib/condition-utils';
import { useAddForm } from '@chemicalluck/engine/editor/lib/use-add-form';
import { useEditorData } from '@chemicalluck/engine/editor/lib/use-editor-data';
import { usePanelEntries } from '@chemicalluck/engine/editor/lib/use-panel-entries';
import type {
  ObjectiveState,
  Quest,
  QuestObjective,
} from '@chemicalluck/engine/features/quests/types';
import type { Condition } from '@chemicalluck/engine/types/condition.types';

// ── State cycling ────────────────────────────────────────────────

const STATE_COLORS: Record<ObjectiveState, string> = {
  locked: 'bg-zinc-700 text-zinc-400',
  available: 'bg-blue-900 text-blue-300',
  complete: 'bg-green-900 text-green-300',
};

const STATE_ORDER: ObjectiveState[] = ['locked', 'available', 'complete'];

// ── Objective row ────────────────────────────────────────────────

interface ObjectiveRowProps {
  objective: QuestObjective;
  onChange: (updated: QuestObjective) => void;
  onRemove: () => void;
}

function ObjectiveRow({ objective, onChange, onRemove }: ObjectiveRowProps) {
  const [editingCond, setEditingCond] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(false);

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
      </div>
    </div>
  );
}

// ── Add Objective form ───────────────────────────────────────────

interface AddObjectiveFormProps {
  onAdd: (obj: QuestObjective) => void;
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
            <Label className="text-xs text-zinc-500">Name</Label>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Visit the library"
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

// ── Add Quest dialog ─────────────────────────────────────────────

interface AddQuestDialogProps {
  onAdd: (quest: Quest) => void;
}

function AddQuestDialog({ onAdd }: AddQuestDialogProps) {
  const { form, submit } = useAddForm({ id: '', name: '' }, ({ id, name }) => {
    onAdd({ id: id.trim(), name: name.trim(), objectives: [] });
  });

  return (
    <AddDialog
      label="New Quest"
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
                <Input {...field} placeholder="my_quest" autoFocus />
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
                <Input {...field} placeholder="My Quest" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Quest detail ─────────────────────────────────────────────────

interface QuestDetailProps {
  quest: Quest;
  onChange: (updated: Quest) => void;
  refs: string[];
}

function QuestDetail({ quest, onChange, refs }: QuestDetailProps) {
  const [showAddObj, setShowAddObj] = useState(false);

  function handleObjectiveChange(idx: number, updated: QuestObjective) {
    onChange({
      ...quest,
      objectives: quest.objectives.map((o, i) => (i === idx ? updated : o)),
    });
  }

  function handleObjectiveRemove(idx: number) {
    onChange({
      ...quest,
      objectives: quest.objectives.filter((_, i) => i !== idx),
    });
  }

  function handleObjectiveAdd(obj: QuestObjective) {
    onChange({ ...quest, objectives: [...quest.objectives, obj] });
    setShowAddObj(false);
  }

  return (
    <FieldGroup>
      <Field>
        <Input
          value={quest.name}
          onChange={(e) => {
            onChange({ ...quest, name: e.target.value });
          }}
          className="h-8 text-base font-medium bg-zinc-800 border-zinc-600"
          placeholder="Quest name…"
        />
      </Field>

      <ReferencedBy refs={refs} />

      <Field>
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Objectives ({quest.objectives.length})
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
        {quest.objectives.map((obj, i) => (
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
        {quest.objectives.length === 0 && !showAddObj && (
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

      <PreviewPane kind="quest" quest={quest} />
    </FieldGroup>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function QuestsPanel() {
  // Objective-name edits cascade into scene/location quest effects at save time.
  // These two files are loaded here (separate from the panel's own `quests`
  // file) so the cascade can patch and persist them.
  const { data: refsLocations, save: saveLocations } = useEditorData<unknown[]>(
    '/editor/api/data/locations',
  );
  const { data: refsScenes, save: saveScenes } = useEditorData<unknown[]>(
    '/editor/api/data/scenes',
  );

  const {
    items: quests,
    ids: questIds,
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
  } = usePanelEntries<Quest>({
    saveMessage: 'Quests saved',
    onSave: (items, original) => {
      const renames = diffObjectiveRenames(
        original as { id: string; objectives: { name: string }[] }[],
        items as { id: string; objectives: { name: string }[] }[],
      );
      if (renames.length > 0) {
        const { patched: patchedScenes, count: sceneCount } =
          patchObjectiveRenames(
            refsScenes as {
              actions?: {
                effects?: {
                  kind?: string;
                  questId?: string;
                  objectiveName?: string;
                }[];
              }[];
            }[],
            renames,
          );
        const { patched: patchedLocations, count: locCount } =
          patchObjectiveRenames(
            refsLocations as {
              actions?: {
                effects?: {
                  kind?: string;
                  questId?: string;
                  objectiveName?: string;
                }[];
              }[];
            }[],
            renames,
          );
        if (sceneCount > 0) void saveScenes(patchedScenes, '');
        if (locCount > 0) void saveLocations(patchedLocations, '');
        const total = sceneCount + locCount;
        if (total > 0) {
          toast.success(
            `${String(total)} objective reference${total === 1 ? '' : 's'} updated`,
          );
        }
      }
      return items;
    },
  });

  const [search, setSearch] = useState('');

  function handleQuestAdd(quest: Quest) {
    handleAdd(quest);
    setSelected(quest.id);
  }

  const filteredQuests = useMemo(() => {
    const all = Object.values(quests);
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (qu) =>
        qu.id.toLowerCase().includes(q) || qu.name.toLowerCase().includes(q),
    );
  }, [quests, search]);

  const activeQuest = selected ? quests[selected] : null;

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddQuestDialog onAdd={handleQuestAdd} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search quests..."
        count={filteredQuests.length}
        total={questIds.length}
      />
      <DataList
        items={filteredQuests}
        getKey={(q) => q.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={questIds}
        onClone={(q, newId) => handleClone(q.id, newId)}
        onDelete={(q) => {
          handleDelete(q.id);
        }}
        getReferences={(q) => referencesFor(q.id)}
        renderItem={(quest) => (
          <>
            <p className="text-sm truncate">{quest.name}</p>
            <p className="text-xs text-zinc-500 truncate">{quest.id}</p>
          </>
        )}
        emptyText="No quests match."
      />
    </>
  );

  return (
    <PanelLayout
      sidebar={sidebar}
      entityId={activeQuest?.id ?? undefined}
      onRename={
        selected
          ? (newId) => {
              void rename(selected, newId);
            }
          : undefined
      }
      references={selected ? referencesFor(selected) : undefined}
    >
      {activeQuest ? (
        <QuestDetail
          quest={activeQuest}
          onChange={(updated) => {
            handleChange(updated.id, updated);
          }}
          refs={referencesFor(activeQuest.id)}
        />
      ) : (
        <p className="text-zinc-500 text-sm">
          Select a quest or create a new one.
        </p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching quests will discard them."
      />
    </PanelLayout>
  );
}

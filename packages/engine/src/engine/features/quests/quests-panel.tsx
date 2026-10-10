import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Field,
  FieldGroup,
} from '@chemicalluck/sim-engine/components/ui/field';
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
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/sim-engine/editor/components/panel-layout';
import { PreviewPane } from '@chemicalluck/sim-engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@chemicalluck/sim-engine/editor/components/referenced-by';
import {
  diffObjectiveRenames,
  patchObjectiveRenames,
} from '@chemicalluck/sim-engine/editor/lib/cascade';
import { useAddForm } from '@chemicalluck/sim-engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import type {
  ObjectiveCondition,
  ObjectiveState,
  ObjectiveTrigger,
  Quest,
  QuestObjective,
} from '@chemicalluck/sim-engine/features/quests/types';

import {
  ObjectiveConditionField,
  ObjectiveTriggerField,
} from './objective-field';

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
  const availableData = useAvailableData();

  function cycleState() {
    const idx = STATE_ORDER.indexOf(objective.state);
    const next = STATE_ORDER[(idx + 1) % STATE_ORDER.length];
    onChange({ ...objective, state: next });
  }

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
        <ObjectiveConditionField
          condition={objective.condition}
          onChange={(condition) => {
            onChange({ ...objective, condition });
          }}
          availableData={availableData}
        />

        {showTriggerSection && (
          <div className="pt-1 border-t border-zinc-800">
            <ObjectiveTriggerField
              trigger={objective.trigger}
              onChange={(trigger) => {
                onChange({ ...objective, trigger });
              }}
              availableData={availableData}
            />
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
  const [condition, setCondition] = useState<ObjectiveCondition | undefined>();
  const [trigger, setTrigger] = useState<ObjectiveTrigger | undefined>();
  const availableData = useAvailableData();

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
          <Label className="text-xs text-zinc-500">Condition</Label>
          <ObjectiveConditionField
            condition={condition}
            onChange={setCondition}
            availableData={availableData}
          />
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
            </div>
            <ObjectiveTriggerField
              trigger={trigger}
              onChange={setTrigger}
              availableData={availableData}
            />
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
      const renames = diffObjectiveRenames(original, items);
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

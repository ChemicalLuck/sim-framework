import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { Checkbox } from '@chemicalluck/engine/components/ui/checkbox';
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
import { ActionGroupsEditor } from '@chemicalluck/engine/editor/components/action-groups-editor';
import {
  AddEffectForm,
  EffectChip,
} from '@chemicalluck/engine/editor/components/effect-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/engine/editor/components/panel-layout';
import { PreviewPane } from '@chemicalluck/engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@chemicalluck/engine/editor/components/referenced-by';
import { editorTemplateContext } from '@chemicalluck/engine/editor/components/template-context';
import { TemplateEditor } from '@chemicalluck/engine/editor/components/template-editor';
import { useAddForm } from '@chemicalluck/engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/engine/editor/lib/use-available-data';
import { usePanelEntries } from '@chemicalluck/engine/editor/lib/use-panel-entries';
import type { JsonScript } from '@chemicalluck/engine/features/core/types';
import { NpcSelectionEditor } from '@chemicalluck/engine/features/npcs/npc-selection-editor';
import type { ActionGroup } from '@chemicalluck/engine/types/action-group.types';
import type { Effect } from '@chemicalluck/engine/types/effect.types';
import type { NpcSelection } from '@chemicalluck/engine/types/npc-filter.types';

interface RawScriptScene {
  kind: 'scene';
  text: string;
  actions: ActionGroup[];
}

interface RawScript {
  id: string;
  order: 'sequential' | 'random';
  duration?: number;
  endTime?: number;
  increment?: number;
  hideProgress?: boolean;
  npcSelection?: NpcSelection;
  completionEffects?: Effect[];
  scenes: RawScriptScene[];
}

// ── Add Script dialog ─────────────────────────────────────────────

interface AddScriptDialogProps {
  onAdd: (script: RawScript) => void;
}

function AddScriptDialog({ onAdd }: AddScriptDialogProps) {
  const { form, submit } = useAddForm(
    { id: '', order: 'sequential' as 'sequential' | 'random', duration: '60' },
    ({ id, order, duration }) => {
      onAdd({
        id: id.trim(),
        order,
        duration: parseInt(duration) || 60,
        scenes: [{ kind: 'scene', text: 'New scene', actions: [] }],
      });
    },
  );

  return (
    <AddDialog
      label="New Script"
      onSubmit={submit}
      canSubmit={!!form.watch('id').trim()}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="event_dog_encounter" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sequential">Sequential</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" />
              </FormControl>
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Scene editor ──────────────────────────────────────────────────

interface SceneEditorProps {
  scene: RawScriptScene;
  index: number;
  onChange: (updated: RawScriptScene) => void;
  onRemove: () => void;
}

function SceneEditor({ scene, index, onChange, onRemove }: SceneEditorProps) {
  const [open, setOpen] = useState(index === 0);
  const availableData = useAvailableData();

  return (
    <div className="border border-zinc-700 rounded-md overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800">
        <button
          onClick={() => {
            setOpen((v) => !v);
          }}
          className="flex items-center gap-1.5 flex-1 text-left"
        >
          {open ? (
            <ChevronDown size={14} className="text-zinc-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-zinc-400 shrink-0" />
          )}
          <span className="text-xs text-zinc-400 font-mono shrink-0">
            scene {index + 1}
          </span>
          {!open && (
            <span className="text-sm text-zinc-300 truncate ml-1">
              {scene.text}
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
        >
          <X size={12} />
        </Button>
      </div>

      {open && (
        <div className="p-3 bg-zinc-900 border-t border-zinc-700/50 space-y-3">
          <Field>
            <Label className="text-xs text-zinc-500">Scene text</Label>
            <TemplateEditor
              value={scene.text}
              onChange={(v) => {
                onChange({ ...scene, text: v });
              }}
              context={editorTemplateContext()}
            />
          </Field>

          <Field>
            <ActionGroupsEditor
              groups={scene.actions}
              onChange={(groups) => {
                onChange({ ...scene, actions: groups });
              }}
              availableData={availableData}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Completion effects editor ─────────────────────────────────────

interface CompletionEffectsProps {
  effects: Effect[];
  onChange: (effects: Effect[]) => void;
}

function CompletionEffects({ effects, onChange }: CompletionEffectsProps) {
  const [adding, setAdding] = useState(false);
  const availableData = useAvailableData();

  return (
    <Field>
      <Label>Completion effects</Label>
      <div className="flex flex-wrap gap-1 items-center min-h-[24px]">
        {effects.map((eff, i) => (
          <EffectChip
            // eslint-disable-next-line
            key={i}
            effect={eff}
            onRemove={() => {
              onChange(effects.filter((_, j) => j !== i));
            }}
          />
        ))}
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(true);
            }}
            className="h-6 text-xs text-zinc-500 hover:text-zinc-300 px-1"
          >
            + effect
          </Button>
        )}
      </div>
      {adding && (
        <AddEffectForm
          onAdd={(eff) => {
            onChange([...effects, eff]);
            setAdding(false);
          }}
          onCancel={() => {
            setAdding(false);
          }}
          availableData={availableData}
        />
      )}
    </Field>
  );
}

// ── Script detail ─────────────────────────────────────────────────

interface ScriptDetailProps {
  script: RawScript;
  onChange: (updated: RawScript) => void;
  refs: string[];
}

function ScriptDetail({ script, onChange, refs }: ScriptDetailProps) {
  const isDuration = script.duration !== undefined;

  function addScene() {
    onChange({
      ...script,
      scenes: [
        ...script.scenes,
        { kind: 'scene', text: 'New scene', actions: [] },
      ],
    });
  }

  return (
    <FieldGroup>
      <ReferencedBy refs={refs} />
      <div className="flex gap-4">
        <Field className="flex-1">
          <Label>Order</Label>
          <Select
            value={script.order}
            onValueChange={(v) => {
              onChange({ ...script, order: v as RawScript['order'] });
            }}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sequential">Sequential</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="flex-1">
          <Label>{isDuration ? 'Duration (minutes)' : 'End time (hour)'}</Label>
          <Input
            type="number"
            min="0"
            value={isDuration ? (script.duration ?? 0) : (script.endTime ?? 0)}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              if (isDuration) onChange({ ...script, duration: val });
              else onChange({ ...script, endTime: val });
            }}
            className="bg-zinc-800 border-zinc-600"
          />
        </Field>
      </div>

      <Field>
        <Label>Increment (sequential step)</Label>
        <Input
          type="number"
          min="1"
          value={script.increment ?? 1}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 1;
            onChange({ ...script, increment: val > 1 ? val : undefined });
          }}
          className="bg-zinc-800 border-zinc-600"
        />
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hideProgress"
            checked={script.hideProgress ?? false}
            onCheckedChange={(v) => {
              onChange({ ...script, hideProgress: v ? true : undefined });
            }}
          />
          <Label htmlFor="hideProgress">Hide progress bar</Label>
        </div>
      </Field>

      <NpcSelectionEditor
        selection={script.npcSelection}
        onChange={(s) => {
          onChange({ ...script, npcSelection: s });
        }}
      />

      <CompletionEffects
        effects={script.completionEffects ?? []}
        onChange={(effects) => {
          onChange({ ...script, completionEffects: effects });
        }}
      />

      <Field>
        <div className="flex items-center gap-2">
          <Label>Scenes ({script.scenes.length})</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addScene}
            className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
          >
            + Add scene
          </Button>
        </div>
        <div className="space-y-2 mt-1">
          {script.scenes.map((scene, i) => (
            <SceneEditor
              // eslint-disable-next-line
              key={i}
              scene={scene}
              index={i}
              onChange={(updated) => {
                onChange({
                  ...script,
                  scenes: script.scenes.map((s, j) => (j === i ? updated : s)),
                });
              }}
              onRemove={() => {
                onChange({
                  ...script,
                  scenes: script.scenes.filter((_, j) => j !== i),
                });
              }}
            />
          ))}
        </div>
      </Field>

      <PreviewPane kind="script" script={script as unknown as JsonScript} />
    </FieldGroup>
  );
}

// ── Main panel ────────────────────────────────────────────────────

export function ScriptsPanel() {
  const {
    items: scripts,
    ids: scriptIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd: addScript,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawScript>({ saveMessage: 'Scripts saved' });
  const [search, setSearch] = useState('');

  function handleAdd(script: RawScript) {
    addScript(script);
    setSelected(script.id);
  }
  const q = search.trim().toLowerCase();
  const filtered = (
    q ? scriptIds.filter((id) => id.toLowerCase().includes(q)) : scriptIds
  ).map((id) => scripts[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddScriptDialog onAdd={handleAdd} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search scripts…"
        count={filtered.length}
        total={scriptIds.length}
      />
      <DataList
        items={filtered}
        getKey={(s) => s.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={scriptIds}
        onClone={(s, newId) => handleClone(s.id, newId)}
        onDelete={(s) => {
          handleDelete(s.id);
        }}
        getReferences={(s) => referencesFor(s.id)}
        renderItem={(s) => (
          <>
            <p className="text-xs font-mono truncate">{s.id}</p>
            <p className="text-xs text-zinc-500 truncate">
              {s.order} · {s.scenes.length} scene
              {s.scenes.length !== 1 ? 's' : ''}
              {s.duration !== undefined ? ` · ${String(s.duration)}m` : ''}
            </p>
          </>
        )}
        emptyText="No scripts match."
      />
    </>
  );

  return (
    <PanelLayout
      sidebar={sidebar}
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
      {selected ? (
        <ScriptDetail
          key={selected}
          script={scripts[selected]}
          onChange={(updated) => {
            handleChange(selected, updated);
          }}
          refs={referencesFor(selected)}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a script</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching scripts will discard them."
      />
    </PanelLayout>
  );
}

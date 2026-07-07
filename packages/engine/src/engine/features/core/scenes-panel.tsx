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
import { ActionGroupsEditor } from '@sim/engine/editor/components/action-groups-editor';
import {
  AddEffectForm,
  EffectChip,
} from '@sim/engine/editor/components/effect-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@sim/engine/editor/components/panel-layout';
import { PreviewPane } from '@sim/engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@sim/engine/editor/components/referenced-by';
import { editorTemplateContext } from '@sim/engine/editor/components/template-context';
import { TemplateEditor } from '@sim/engine/editor/components/template-editor';
import { useAddForm } from '@sim/engine/editor/lib/use-add-form';
import {
  type AvailableData,
  useAvailableData,
} from '@sim/engine/editor/lib/use-available-data';
import { usePanelEntries } from '@sim/engine/editor/lib/use-panel-entries';
import type { JsonScene } from '@sim/engine/features/core/types';
import { NpcSelectionEditor } from '@sim/engine/features/npcs/npc-selection-editor';
import type { Effect } from '@sim/engine/types/effect.types';
import type { Scene } from '@sim/engine/types/scene.types';

type RawScene = Scene & { id: string };

// ── Add Scene dialog ─────────────────────────────────────────────

interface AddSceneDialogProps {
  onAdd: (id: string, scene: RawScene) => void;
}

function AddSceneDialog({ onAdd }: AddSceneDialogProps) {
  const { form, submit } = useAddForm({ id: '', text: '' }, ({ id, text }) => {
    const trimId = id.trim();
    const trimText = text.trim();
    onAdd(trimId, { id: trimId, kind: 'scene', text: trimText, actions: [] });
  });

  return (
    <AddDialog
      label="New Scene"
      onSubmit={submit}
      canSubmit={!!form.watch('id').trim() && !!form.watch('text').trim()}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="scene_library" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text</FormLabel>
              <FormControl>
                <TemplateEditor
                  value={field.value}
                  onChange={field.onChange}
                  context={editorTemplateContext()}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Scene detail ─────────────────────────────────────────────────

interface SceneDetailProps {
  id: string;
  scene: RawScene;
  onChange: (id: string, updated: RawScene) => void;
  locationRefs: string[];
  availableData: AvailableData;
}

function SceneDetail({
  id,
  scene,
  onChange,
  locationRefs,
  availableData,
}: SceneDetailProps) {
  const [addingEffect, setAddingEffect] = useState(false);

  return (
    <FieldGroup>
      <Field>
        <Label>Scene text</Label>
        <TemplateEditor
          value={scene.text}
          onChange={(v) => {
            onChange(id, { ...scene, text: v });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <ReferencedBy refs={locationRefs} />

      <NpcSelectionEditor
        selection={scene.npcSelection}
        onChange={(s) => {
          onChange(id, { ...scene, npcSelection: s });
        }}
      />

      <Field>
        <div className="flex items-center gap-2 mb-1">
          <Label>On complete</Label>
          <div className="flex flex-wrap gap-1 flex-1">
            {(scene.completionEffects ?? []).map((effect, i) => (
              <EffectChip
                // eslint-disable-next-line react-x/no-array-index-key
                key={i}
                effect={effect}
                onRemove={() => {
                  const next = (scene.completionEffects ?? []).filter(
                    (_, idx) => idx !== i,
                  );
                  onChange(id, {
                    ...scene,
                    completionEffects: next.length ? next : undefined,
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
            className="h-6 text-xs text-zinc-500 hover:text-zinc-300 shrink-0"
          >
            + Add
          </Button>
        </div>
        {addingEffect && (
          <AddEffectForm
            onAdd={(effect: Effect) => {
              onChange(id, {
                ...scene,
                completionEffects: [...(scene.completionEffects ?? []), effect],
              });
              setAddingEffect(false);
            }}
            onCancel={() => {
              setAddingEffect(false);
            }}
            availableData={availableData}
          />
        )}
      </Field>

      <Field>
        <ActionGroupsEditor
          groups={scene.actions}
          onChange={(groups) => {
            onChange(id, { ...scene, actions: groups });
          }}
          availableData={availableData}
        />
      </Field>

      <PreviewPane kind="scene" scene={scene as unknown as JsonScene} />
    </FieldGroup>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function ScenesPanel() {
  const availableData = useAvailableData();
  const {
    items: scenes,
    ids: sceneIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange: handleSceneChange,
    handleAdd,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawScene>({ saveMessage: 'Scenes saved' });
  const [search, setSearch] = useState('');

  function handleAddScene(id: string, scene: RawScene) {
    handleAdd(scene);
    setSelected(id);
  }
  const q = search.trim().toLowerCase();
  const filteredScenes = (
    q
      ? sceneIds.filter(
          (id) =>
            id.toLowerCase().includes(q) ||
            scenes[id].text.toLowerCase().includes(q),
        )
      : sceneIds
  ).map((id) => scenes[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddSceneDialog onAdd={handleAddScene} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search scenes..."
        count={filteredScenes.length}
        total={sceneIds.length}
      />
      <DataList
        items={filteredScenes}
        getKey={(s) => s.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={sceneIds}
        onClone={(s, newId) => handleClone(s.id, newId)}
        onDelete={(s) => {
          handleDelete(s.id);
        }}
        getReferences={(s) => referencesFor(s.id)}
        renderItem={(s) => (
          <>
            <p className="text-xs font-mono truncate">{s.id}</p>
            <p className="text-xs text-zinc-500 truncate">
              {s.actions.reduce((n, g) => n + g.actions.length, 0)} actions
            </p>
          </>
        )}
        emptyText="No scenes match."
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
        <SceneDetail
          key={selected}
          id={selected}
          scene={scenes[selected]}
          onChange={handleSceneChange}
          locationRefs={referencesFor(selected)}
          availableData={availableData}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a scene</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching scenes will discard them."
      />
    </PanelLayout>
  );
}

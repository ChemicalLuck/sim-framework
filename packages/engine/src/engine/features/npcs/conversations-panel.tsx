import { useState } from 'react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Checkbox } from '@chemicalluck/sim-engine/components/ui/checkbox';
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
import { editorTemplateContext } from '@chemicalluck/sim-engine/editor/components/template-context';
import { TemplateEditor } from '@chemicalluck/sim-engine/editor/components/template-editor';
import { useAddForm } from '@chemicalluck/sim-engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import type {
  ConversationTopic,
  ConversationTopicVisibility,
} from '@chemicalluck/sim-engine/features/npcs/types';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

// ── Add Topic dialog ─────────────────────────────────────────────

export function AddTopicDialog({
  onAdd,
}: {
  onAdd: (t: ConversationTopic) => void;
}) {
  const { form, submit } = useAddForm(
    { id: '', label: '' },
    ({ id, label }) => {
      onAdd({ id: id.trim(), label: label.trim(), response: '' });
    },
  );

  return (
    <AddDialog
      label="New Topic"
      onSubmit={submit}
      canSubmit={!!form.watch('id').trim() && !!form.watch('label').trim()}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ask_date" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ask them on a date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Visibility editor ────────────────────────────────────────────

function VisibilityEditor({
  vis,
  onChange,
}: {
  vis: ConversationTopicVisibility | undefined;
  onChange: (v: ConversationTopicVisibility | undefined) => void;
}) {
  const v = vis ?? {};

  function update(patch: Partial<ConversationTopicVisibility>) {
    const next = { ...v, ...patch };
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, val]) => val !== false),
    ) as ConversationTopicVisibility;
    onChange(Object.keys(cleaned).length ? cleaned : undefined);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox
            checked={v.requireKnown ?? false}
            onCheckedChange={(c) => {
              update({ requireKnown: c === true ? true : undefined });
            }}
          />
          Require known
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <Checkbox
            checked={v.hideIfKnown ?? false}
            onCheckedChange={(c) => {
              update({ hideIfKnown: c === true ? true : undefined });
            }}
          />
          Hide if known
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['minFriendship', 'Min Friendship'],
            ['minRomance', 'Min Romance'],
            ['minAttraction', 'Min Attraction'],
          ] as const
        ).map(([key, lbl]) => (
          <Field key={key}>
            <Label className="text-xs">{lbl}</Label>
            <Input
              type="number"
              className="h-7 text-xs"
              value={v[key] ?? ''}
              placeholder="—"
              min={0}
              onChange={(e) => {
                const val =
                  e.target.value === '' ? undefined : Number(e.target.value);
                update({ [key]: val });
              }}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

// ── Topic detail editor ──────────────────────────────────────────

export function TopicDetail({
  topic,
  onChange,
}: {
  topic: ConversationTopic;
  onChange: (t: ConversationTopic) => void;
}) {
  const availableData = useAvailableData();
  const [showAddEffect, setShowAddEffect] = useState(false);
  const [editingEffectIdx, setEditingEffectIdx] = useState<number | null>(null);
  const effects = topic.effects ?? [];
  const editingEffect =
    editingEffectIdx != null ? effects[editingEffectIdx] : undefined;

  function addEffect(e: Effect) {
    onChange({ ...topic, effects: [...effects, e] });
    setShowAddEffect(false);
  }

  function removeEffect(idx: number) {
    if (editingEffectIdx === idx) setEditingEffectIdx(null);
    onChange({ ...topic, effects: effects.filter((_, i) => i !== idx) });
  }

  function replaceEffect(idx: number, e: Effect) {
    onChange({ ...topic, effects: effects.map((x, i) => (i === idx ? e : x)) });
    setEditingEffectIdx(null);
  }

  return (
    <FieldGroup>
      <Field>
        <Label>ID</Label>
        <Input
          value={topic.id}
          onChange={(e) => {
            onChange({ ...topic, id: e.target.value });
          }}
          placeholder="ask_date"
          className="font-mono"
        />
      </Field>

      <Field>
        <Label>Label</Label>
        <TemplateEditor
          value={topic.label}
          onChange={(v) => {
            onChange({ ...topic, label: v });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <Field>
        <Label>Response</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Tokens: <code className="text-xs">{'{npc0.name}'}</code>{' '}
          <code className="text-xs">{'{npc0.firstName}'}</code>{' '}
          <code className="text-xs">{'{npc0.subject}'}</code>{' '}
          <code className="text-xs">{'{cap:npc0.subject}'}</code>{' '}
          <code className="text-xs">{'{npc0.profession}'}</code>
        </p>
        <TemplateEditor
          value={topic.response}
          onChange={(v) => {
            onChange({ ...topic, response: v });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <VisibilityEditor
          vis={topic.visibility}
          onChange={(v) => {
            onChange({ ...topic, visibility: v });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Effects</Label>
        <p className="text-xs text-muted-foreground">
          Use <code className="text-xs">$npc</code> as NPC ID for the
          conversation partner.
        </p>
        <div className="flex flex-wrap gap-1">
          {effects.map((e, i) => (
            <EffectChip
              // eslint-disable-next-line react-x/no-array-index-key
              key={i}
              effect={e}
              onRemove={() => {
                removeEffect(i);
              }}
              onClick={() => {
                setEditingEffectIdx(editingEffectIdx === i ? null : i);
                setShowAddEffect(false);
              }}
            />
          ))}
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={() => {
              setShowAddEffect(!showAddEffect);
              setEditingEffectIdx(null);
            }}
          >
            + Add
          </Button>
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
        {editingEffect != null && editingEffectIdx != null && (
          <AddEffectForm
            initial={editingEffect}
            onAdd={(e) => {
              replaceEffect(editingEffectIdx, e);
            }}
            onCancel={() => {
              setEditingEffectIdx(null);
            }}
            availableData={availableData}
          />
        )}
      </div>

      <PreviewPane kind="conversation" topic={topic} />
    </FieldGroup>
  );
}

// ── Panel ────────────────────────────────────────────────────────

export function ConversationsPanel() {
  const {
    items: topics,
    ids: topicIds,
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
  } = usePanelEntries<ConversationTopic>({
    saveMessage: 'Conversations saved',
  });
  const [search, setSearch] = useState('');

  function handleAddTopic(t: ConversationTopic) {
    handleAdd(t);
    setSelected(t.id);
  }

  const q = search.trim().toLowerCase();
  const filtered = (
    q
      ? topicIds.filter(
          (id) =>
            id.toLowerCase().includes(q) ||
            topics[id].label.toLowerCase().includes(q),
        )
      : topicIds
  ).map((id) => topics[id]);

  const selectedTopic = selected ? topics[selected] : null;

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddTopicDialog onAdd={handleAddTopic} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Filter topics…"
        count={filtered.length}
        total={topicIds.length}
      />
      <DataList
        items={filtered}
        getKey={(t) => t.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={topicIds}
        onClone={(t, newId) => handleClone(t.id, newId)}
        onDelete={(t) => {
          handleDelete(t.id);
        }}
        getReferences={(t) => referencesFor(t.id)}
        renderItem={(t) => (
          <div>
            <div className="text-xs font-medium truncate">{t.label}</div>
            <div className="text-xs text-zinc-500 font-mono">{t.id}</div>
          </div>
        )}
        emptyText="No topics found."
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
      {selectedTopic ? (
        <TopicDetail
          key={selected}
          topic={selectedTopic}
          onChange={(t) => {
            if (t.id !== selectedTopic.id) {
              handleDelete(selectedTopic.id);
              handleAdd(t);
              setSelected(t.id);
            } else {
              handleChange(selectedTopic.id, t);
            }
          }}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a topic to edit it.</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching topics will discard them."
      />
    </PanelLayout>
  );
}

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
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
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/sim-engine/editor/components/panel-layout';
import { useAddForm } from '@chemicalluck/sim-engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import {
  getAppearanceLists,
  getAppearanceWeights,
} from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import { getProfessions } from '@chemicalluck/sim-engine/features/npcs/lib/professions';
import type {
  NamedNpcDefinition,
  NpcScheduleEntry,
} from '@chemicalluck/sim-engine/features/npcs/types';
import type { ConversationTopic } from '@chemicalluck/sim-engine/features/npcs/types';

import { AddTopicDialog, TopicDetail } from './conversations-panel';

const DEFAULT_PRONOUNS: NamedNpcDefinition['pronouns'] = {
  subject: 'they',
  object: 'them',
  possessive: 'their',
  reflexive: 'themself',
  noun: 'person',
};

function derivePronouns(featureValue: string): NamedNpcDefinition['pronouns'] {
  const config = getAppearanceWeights();
  if (config.pronounFeatureId) {
    const feat = config.features.find((f) => f.id === config.pronounFeatureId);
    if (feat?.pronouns?.[featureValue]) {
      return feat.pronouns[featureValue];
    }
  }
  return DEFAULT_PRONOUNS;
}

// ── Default NPC ──────────────────────────────────────────────────

function makeDefault(
  id: string,
  firstName: string,
  lastName: string,
): NamedNpcDefinition {
  const features = getAppearanceLists();
  const appearance: Record<string, string> = Object.fromEntries(
    features.map((f) => [f.id, f.values[0] ?? '']),
  );
  return {
    id,
    profile: {
      firstName,
      lastName,
      profession: getProfessions()[0] ?? '',
      age: 20,
      appearance,
    },
    pronouns: DEFAULT_PRONOUNS,
    equipment: {},
    skills: {},
    traits: [],
    schedule: [],
    topics: [],
  };
}

// ── Add dialog ───────────────────────────────────────────────────

function AddNpcDialog({ onAdd }: { onAdd: (npc: NamedNpcDefinition) => void }) {
  const { form, submit } = useAddForm(
    { id: '', firstName: '', lastName: '' },
    ({ id, firstName, lastName }) => {
      onAdd(makeDefault(id.trim(), firstName.trim(), lastName.trim()));
    },
  );

  return (
    <AddDialog
      label="New Named NPC"
      onSubmit={submit}
      canSubmit={
        !!form.watch('id').trim() &&
        !!form.watch('firstName').trim() &&
        !!form.watch('lastName').trim()
      }
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="named_elena_voss"
                  autoFocus
                  className="font-mono"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Elena" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Voss" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Appearance Select helper ─────────────────────────────────────

function AppearanceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

// ── Schedule editor ──────────────────────────────────────────────

function ScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: NpcScheduleEntry[];
  onChange: (s: NpcScheduleEntry[]) => void;
}) {
  const _availableData = useAvailableData();
  const locationIds = (_availableData.locations as string[] | undefined) ?? [];

  function addEntry() {
    onChange([
      ...schedule,
      { locationId: locationIds[0] ?? '', after: 8, before: 20 },
    ]);
  }

  function removeEntry(i: number) {
    onChange(schedule.filter((_, idx) => idx !== i));
  }

  function updateEntry(i: number, patch: Partial<NpcScheduleEntry>) {
    onChange(schedule.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  return (
    <div className="space-y-2">
      {schedule.map((entry, i) => (
        <div
          // eslint-disable-next-line react-x/no-array-index-key
          key={i}
          className="flex items-end gap-2 bg-zinc-800 p-2 rounded"
        >
          <Field className="flex-1">
            <Label className="text-xs">Location</Label>
            <Select
              value={entry.locationId}
              onValueChange={(v) => {
                updateEntry(i, { locationId: v });
              }}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select location…" />
              </SelectTrigger>
              <SelectContent>
                {locationIds.map((id) => (
                  <SelectItem key={id} value={id} className="text-xs font-mono">
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className="w-16">
            <Label className="text-xs">After</Label>
            <Input
              type="number"
              min={0}
              max={23}
              className="h-7 text-xs"
              value={entry.after}
              onChange={(e) => {
                updateEntry(i, { after: Number(e.target.value) });
              }}
            />
          </Field>
          <Field className="w-16">
            <Label className="text-xs">Before</Label>
            <Input
              type="number"
              min={0}
              max={23}
              className="h-7 text-xs"
              value={entry.before}
              onChange={(e) => {
                updateEntry(i, { before: Number(e.target.value) });
              }}
            />
          </Field>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-zinc-500 hover:text-red-400"
            onClick={() => {
              removeEntry(i);
            }}
          >
            <X size={12} />
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={addEntry}
        disabled={locationIds.length === 0}
      >
        <Plus size={12} /> Add schedule entry
      </Button>
    </div>
  );
}

// ── Topic sub-list ───────────────────────────────────────────────

function TopicsSection({
  topics,
  onChange,
}: {
  topics: ConversationTopic[];
  onChange: (t: ConversationTopic[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    topics[0]?.id ?? null,
  );

  const selectedTopic = selectedId
    ? (topics.find((t) => t.id === selectedId) ?? null)
    : null;

  function handleAdd(t: ConversationTopic) {
    onChange([...topics, t]);
    setSelectedId(t.id);
  }

  function handleChange(t: ConversationTopic) {
    onChange(topics.map((x) => (x.id === selectedId ? t : x)));
    if (t.id !== selectedId) setSelectedId(t.id);
  }

  function handleRemove() {
    if (!selectedId) return;
    const next = topics.filter((t) => t.id !== selectedId);
    onChange(next);
    setSelectedId(next[0]?.id ?? null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <AddTopicDialog onAdd={handleAdd} />
      </div>
      {topics.length > 0 && (
        <div className="border border-zinc-700 rounded overflow-hidden">
          <div className="flex border-b border-zinc-700">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedId(t.id);
                }}
                className={`px-3 py-1.5 text-xs border-r border-zinc-700 last:border-r-0 truncate max-w-32 ${
                  t.id === selectedId
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {t.label || t.id}
              </button>
            ))}
          </div>
          {selectedTopic && (
            <div className="p-3">
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemove}
                  className="text-xs text-zinc-500 hover:text-red-400 h-6"
                >
                  <X size={12} /> Delete topic
                </Button>
              </div>
              <TopicDetail
                key={selectedId}
                topic={selectedTopic}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── NPC detail editor ────────────────────────────────────────────

const PRONOUN_FIELDS = [
  'subject',
  'object',
  'possessive',
  'reflexive',
  'noun',
] as const;

function NpcDetail({
  npc,
  onChange,
}: {
  npc: NamedNpcDefinition;
  onChange: (n: NamedNpcDefinition) => void;
}) {
  const appearanceFeatures = getAppearanceLists();
  const config = getAppearanceWeights();

  function patchProfile(patch: Partial<NamedNpcDefinition['profile']>) {
    onChange({ ...npc, profile: { ...npc.profile, ...patch } });
  }

  function patchAppearance(featureId: string, value: string) {
    const appearance = { ...npc.profile.appearance, [featureId]: value };
    let updated: NamedNpcDefinition = {
      ...npc,
      profile: { ...npc.profile, appearance },
    };
    // Auto-update pronouns when the pronoun feature changes
    if (featureId === config.pronounFeatureId) {
      updated = { ...updated, pronouns: derivePronouns(value) };
    }
    onChange(updated);
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Identity
        </h3>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-2">
            <Field>
              <Label className="text-xs">First name</Label>
              <Input
                value={npc.profile.firstName}
                onChange={(e) => {
                  patchProfile({ firstName: e.target.value });
                }}
                className="h-7 text-xs"
              />
            </Field>
            <Field>
              <Label className="text-xs">Last name</Label>
              <Input
                value={npc.profile.lastName}
                onChange={(e) => {
                  patchProfile({ lastName: e.target.value });
                }}
                className="h-7 text-xs"
              />
            </Field>
            <AppearanceSelect
              label="Profession"
              value={npc.profile.profession}
              options={getProfessions()}
              onChange={(v) => {
                patchProfile({ profession: v });
              }}
            />
            <Field>
              <Label className="text-xs">Age</Label>
              <Input
                type="number"
                min={1}
                max={100}
                className="h-7 text-xs"
                value={npc.profile.age}
                onChange={(e) => {
                  patchProfile({ age: Number(e.target.value) });
                }}
              />
            </Field>
          </div>
        </FieldGroup>
      </div>

      {/* Appearance */}
      {appearanceFeatures.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Appearance
          </h3>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-2">
              {appearanceFeatures.map((feat) => (
                <AppearanceSelect
                  key={feat.id}
                  label={feat.label}
                  value={npc.profile.appearance[feat.id] ?? ''}
                  options={feat.values}
                  onChange={(v) => {
                    patchAppearance(feat.id, v);
                  }}
                />
              ))}
            </div>
          </FieldGroup>
        </div>
      )}

      {/* Pronouns */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Pronouns
        </h3>
        <FieldGroup>
          <div className="grid grid-cols-5 gap-2">
            {PRONOUN_FIELDS.map((field) => (
              <Field key={field}>
                <Label className="text-xs">{field}</Label>
                <Input
                  value={npc.pronouns[field]}
                  onChange={(e) => {
                    onChange({
                      ...npc,
                      pronouns: { ...npc.pronouns, [field]: e.target.value },
                    });
                  }}
                  className="h-7 text-xs"
                />
              </Field>
            ))}
          </div>
        </FieldGroup>
      </div>

      {/* Schedule */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Schedule
        </h3>
        <p className="text-xs text-zinc-500 mb-2">
          When and where this NPC appears in the nearby pool. Empty = never
          appears automatically (reference by ID only).
        </p>
        <ScheduleEditor
          schedule={npc.schedule ?? []}
          onChange={(schedule) => {
            onChange({ ...npc, schedule });
          }}
        />
      </div>

      {/* Topics */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Conversation Topics
        </h3>
        <p className="text-xs text-zinc-500 mb-2">
          NPC-specific topics shown before global topics in conversation.
        </p>
        <TopicsSection
          topics={npc.topics ?? []}
          onChange={(topics) => {
            onChange({ ...npc, topics });
          }}
        />
      </div>
    </div>
  );
}

// ── Panel ────────────────────────────────────────────────────────

export function NamedNpcsPanel() {
  const {
    items: npcs,
    ids: npcIds,
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
  } = usePanelEntries<NamedNpcDefinition>({ saveMessage: 'Named NPCs saved' });
  const [search, setSearch] = useState('');

  function handleAddNpc(npc: NamedNpcDefinition) {
    handleAdd(npc);
    setSelected(npc.id);
  }

  const q = search.trim().toLowerCase();
  const filtered = (
    q
      ? npcIds.filter(
          (id) =>
            id.toLowerCase().includes(q) ||
            `${npcs[id].profile.firstName} ${npcs[id].profile.lastName}`
              .toLowerCase()
              .includes(q),
        )
      : npcIds
  ).map((id) => npcs[id]);

  const selectedNpc = selected ? npcs[selected] : null;

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddNpcDialog onAdd={handleAddNpc} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Filter NPCs…"
        count={filtered.length}
        total={npcIds.length}
      />
      <DataList
        items={filtered}
        getKey={(n) => n.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={npcIds}
        onClone={(n, newId) => handleClone(n.id, newId)}
        onDelete={(n) => {
          handleDelete(n.id);
        }}
        getReferences={(n) => referencesFor(n.id)}
        renderItem={(n) => (
          <div>
            <div className="text-xs font-medium truncate">
              {n.profile.firstName} {n.profile.lastName}
            </div>
            <div className="text-xs text-zinc-500 font-mono truncate">
              {n.id}
            </div>
          </div>
        )}
        emptyText="No named NPCs found."
      />
    </>
  );

  return (
    <PanelLayout
      sidebar={sidebar}
      sidebarWidth="w-56"
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
      {selectedNpc ? (
        <NpcDetail
          key={selected}
          npc={selectedNpc}
          onChange={(npc) => {
            handleChange(selectedNpc.id, npc);
          }}
        />
      ) : (
        <p className="text-zinc-500 text-sm">
          {npcIds.length === 0
            ? 'No named NPCs yet. Add one to get started.'
            : 'Select a named NPC to edit.'}
        </p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching NPCs will discard them."
      />
    </PanelLayout>
  );
}

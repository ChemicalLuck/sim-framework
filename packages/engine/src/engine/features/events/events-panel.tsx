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
import {
  ConditionChip,
  ConditionEditor,
} from '@chemicalluck/engine/editor/components/condition-form';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/engine/editor/components/panel-layout';
import { PreviewPane } from '@chemicalluck/engine/editor/components/preview/preview-pane';
import { ReferencedBy } from '@chemicalluck/engine/editor/components/referenced-by';
import { useAddForm } from '@chemicalluck/engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/engine/editor/lib/use-available-data';
import { useEditorData } from '@chemicalluck/engine/editor/lib/use-editor-data';
import { usePanelEntries } from '@chemicalluck/engine/editor/lib/use-panel-entries';
import type { JsonScript } from '@chemicalluck/engine/features/core/types';
import type { JsonRandomEvent } from '@chemicalluck/engine/features/events/authoring.types';
import type { Condition } from '@chemicalluck/engine/types/condition.types';

interface RawEvent {
  id: string;
  probability: number;
  scriptId: string;
  cancels?: boolean;
  condition?: Condition;
}

// ── Add Event dialog ──────────────────────────────────────────────

interface AddEventDialogProps {
  onAdd: (event: RawEvent) => void;
}

function AddEventDialog({ onAdd }: AddEventDialogProps) {
  const availableData = useAvailableData();
  const { form, submit } = useAddForm(
    { id: '', scriptId: '', probability: '0.1' },
    ({ id, scriptId, probability }) => {
      onAdd({
        id: id.trim(),
        probability: Math.min(1, Math.max(0, parseFloat(probability) || 0.1)),
        scriptId: scriptId.trim(),
      });
    },
  );

  return (
    <AddDialog
      label="New Event"
      onSubmit={submit}
      canSubmit={!!form.watch('id').trim() && !!form.watch('scriptId').trim()}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder="dog_in_park" autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="scriptId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Script</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select script…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {((availableData.scripts as string[] | undefined) ?? []).map(
                    (id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="probability"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probability (0–1)</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="0" max="1" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Event detail ──────────────────────────────────────────────────

interface EventDetailProps {
  event: RawEvent;
  onChange: (updated: RawEvent) => void;
  refs: string[];
}

function EventDetail({ event, onChange, refs }: EventDetailProps) {
  const [editingCondition, setEditingCondition] = useState(false);
  const availableData = useAvailableData();
  const { data: scripts } = useEditorData<JsonScript[]>(
    '/editor/api/data/scripts',
  );
  const script = scripts.find((s) => s.id === event.scriptId);

  return (
    <FieldGroup>
      <ReferencedBy refs={refs} />

      <Field>
        <Label>Probability</Label>
        <Input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={event.probability}
          onChange={(e) => {
            const val = Math.min(
              1,
              Math.max(0, parseFloat(e.target.value) || 0),
            );
            onChange({ ...event, probability: val });
          }}
          className="bg-zinc-800 border-zinc-600"
        />
        <p className="text-xs text-zinc-500">
          {(event.probability * 100).toFixed(0)}% chance of firing
        </p>
      </Field>

      <Field>
        <Label>Script</Label>
        <Select
          value={event.scriptId}
          onValueChange={(v) => {
            onChange({ ...event, scriptId: v });
          }}
        >
          <SelectTrigger className="bg-zinc-800 border-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {((availableData.scripts as string[] | undefined) ?? []).map(
              (id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cancels"
            checked={event.cancels ?? true}
            onCheckedChange={(v) => {
              onChange({ ...event, cancels: v === true ? true : false });
            }}
          />
          <Label htmlFor="cancels">Cancels action effects</Label>
        </div>
        <p className="text-xs text-zinc-500">
          When checked, the action's effects are suppressed if this event fires.
        </p>
      </Field>

      <Field>
        <Label>Condition</Label>
        {event.condition ? (
          <div className="flex items-center gap-2">
            <ConditionChip
              condition={event.condition}
              onEdit={() => {
                setEditingCondition(true);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange({ ...event, condition: undefined });
              }}
              className="h-6 text-xs text-zinc-500 hover:text-red-400 px-1"
            >
              Remove
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingCondition(true);
            }}
            className="h-6 text-xs text-zinc-500 hover:text-zinc-300 px-1"
          >
            + Add condition
          </Button>
        )}
        {editingCondition && (
          <ConditionEditor
            initial={event.condition}
            onSave={(c) => {
              onChange({ ...event, condition: c });
              setEditingCondition(false);
            }}
            onCancel={() => {
              setEditingCondition(false);
            }}
          />
        )}
      </Field>

      <PreviewPane
        kind="event"
        event={event as unknown as JsonRandomEvent}
        script={script}
      />
    </FieldGroup>
  );
}

// ── Main panel ────────────────────────────────────────────────────

export function EventsPanel() {
  const {
    items: events,
    ids: eventIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd: addEvent,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawEvent>({ saveMessage: 'Events saved' });

  const [search, setSearch] = useState('');

  function handleAdd(event: RawEvent) {
    addEvent(event);
    setSelected(event.id);
  }

  const q = search.trim().toLowerCase();
  const filtered = (
    q ? eventIds.filter((id) => id.toLowerCase().includes(q)) : eventIds
  ).map((id) => events[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddEventDialog onAdd={handleAdd} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search events…"
        count={filtered.length}
        total={eventIds.length}
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
        allKeys={eventIds}
        onClone={(e, newId) => handleClone(e.id, newId)}
        onDelete={(e) => {
          handleDelete(e.id);
        }}
        getReferences={(e) => referencesFor(e.id)}
        renderItem={(e) => (
          <>
            <p className="text-xs font-mono truncate">{e.id}</p>
            <p className="text-xs text-zinc-500 truncate">
              {(e.probability * 100).toFixed(0)}% · {e.scriptId}
              {e.cancels !== false ? ' · cancels' : ''}
            </p>
          </>
        )}
        emptyText="No events match."
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
        <EventDetail
          key={selected}
          event={events[selected]}
          onChange={(updated) => {
            handleChange(selected, updated);
          }}
          refs={referencesFor(selected)}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select an event</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching events will discard them."
      />
    </PanelLayout>
  );
}

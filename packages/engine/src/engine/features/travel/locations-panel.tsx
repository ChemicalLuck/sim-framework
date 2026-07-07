import { useEffect, useRef, useState } from 'react';
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
import { Textarea } from '@chemicalluck/sim-engine/components/ui/textarea';
import { ActionGroupsEditor } from '@chemicalluck/sim-engine/editor/components/action-groups-editor';
import { ConditionField } from '@chemicalluck/sim-engine/editor/components/condition-field';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/sim-engine/editor/components/panel-layout';
import { editorTemplateContext } from '@chemicalluck/sim-engine/editor/components/template-context';
import { TemplateEditor } from '@chemicalluck/sim-engine/editor/components/template-editor';
import { useAddForm } from '@chemicalluck/sim-engine/editor/lib/use-add-form';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import type { ActionGroup } from '@chemicalluck/sim-engine/types/action-group.types';
import type { Condition } from '@chemicalluck/sim-engine/types/condition.types';

interface RawLocation {
  id: string;
  name: string;
  kind: 'interior' | 'exterior';
  parent?: string;
  description?: string;
  entryText?: string;
  condition?: Condition;
  nearby?: unknown;
  actions?: ActionGroup[];
}

// ── Add Location dialog ───────────────────────────────────────────

interface AddLocationDialogProps {
  onAdd: (location: RawLocation) => void;
  locationIds: string[];
}

function AddLocationDialog({ onAdd, locationIds }: AddLocationDialogProps) {
  const { form, submit } = useAddForm(
    {
      id: '',
      name: '',
      kind: 'interior' as 'interior' | 'exterior',
      parent: '',
    },
    ({ id, name, kind, parent }) => {
      onAdd({
        id: id.trim(),
        name: name.trim(),
        kind,
        parent: parent.trim() || undefined,
        actions: [],
      });
    },
  );

  return (
    <AddDialog
      label="New Location"
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
                <Input {...field} placeholder="town_park" autoFocus />
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
                <Input {...field} placeholder="Town Park" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kind</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent (optional)</FormLabel>
              <Select
                value={field.value || '__none__'}
                onValueChange={(v) => {
                  field.onChange(v === '__none__' ? '' : v);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {locationIds.map((id) => (
                    <SelectItem key={id} value={id}>
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Location detail ───────────────────────────────────────────────

interface LocationDetailProps {
  location: RawLocation;
  onChange: (updated: RawLocation) => void;
  locationIds: string[];
}

function LocationDetail({
  location,
  onChange,
  locationIds,
}: LocationDetailProps) {
  const availableData = useAvailableData();
  const otherLocations = locationIds.filter((id) => id !== location.id);

  return (
    <FieldGroup>
      <div className="flex gap-4">
        <Field>
          <Label>Name</Label>
          <Input
            value={location.name}
            onChange={(e) => {
              onChange({ ...location, name: e.target.value });
            }}
          />
        </Field>

        <Field>
          <Label>Kind</Label>
          <Select
            value={location.kind}
            onValueChange={(v) => {
              onChange({ ...location, kind: v as RawLocation['kind'] });
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exterior">Exterior</SelectItem>
              <SelectItem value="interior">Interior</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <Label>Parent</Label>
        <Select
          value={location.parent ?? '__none__'}
          onValueChange={(v) => {
            onChange({ ...location, parent: v === '__none__' ? undefined : v });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="No parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— None —</SelectItem>
            {otherLocations.map((id) => (
              <SelectItem key={id} value={id}>
                {id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <Label>Description</Label>
        <TemplateEditor
          value={location.description ?? ''}
          onChange={(v) => {
            onChange({ ...location, description: v || undefined });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <Field>
        <Label>Entry text</Label>
        <TemplateEditor
          value={location.entryText ?? ''}
          onChange={(v) => {
            onChange({ ...location, entryText: v || undefined });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <Field>
        <Label>Access condition</Label>
        <ConditionField
          condition={location.condition}
          onChange={(c) => {
            onChange({ ...location, condition: c });
          }}
        />
      </Field>

      {location.nearby !== undefined && (
        <Field>
          <Label>Nearby config (raw JSON)</Label>
          <NearbyJsonField
            value={location.nearby}
            onChange={(nearby) => {
              onChange({ ...location, nearby });
            }}
          />
        </Field>
      )}

      {location.nearby === undefined && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onChange({
              ...location,
              nearby: {
                professions: ['Student'],
                minAge: 18,
                maxAge: 25,
                min: 0,
                max: 3,
              },
            });
          }}
          className="self-start h-7 text-xs text-zinc-500 hover:text-zinc-300"
        >
          + Add nearby config
        </Button>
      )}

      <Field>
        <ActionGroupsEditor
          groups={location.actions ?? []}
          onChange={(groups) => {
            onChange({
              ...location,
              actions: groups.length ? groups : undefined,
            });
          }}
          availableData={availableData}
        />
      </Field>
    </FieldGroup>
  );
}

// ── Nearby JSON field ─────────────────────────────────────────────

interface NearbyJsonFieldProps {
  value: unknown;
  onChange: (v: unknown) => void;
}

function NearbyJsonField({ value, onChange }: NearbyJsonFieldProps) {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const lastWriteRef = useRef<unknown>(value);

  useEffect(() => {
    if (value !== lastWriteRef.current) {
      setDraft(JSON.stringify(value, null, 2));
      lastWriteRef.current = value;
      setError(null);
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Textarea
        value={draft}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          try {
            const parsed: unknown = JSON.parse(text);
            lastWriteRef.current = parsed;
            onChange(parsed);
            setError(null);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        spellCheck={false}
        className="h-32 font-mono text-xs"
      />
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────

export function LocationsPanel() {
  const {
    items: locations,
    ids: locationIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd: addItem,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawLocation>({ saveMessage: 'Locations saved' });
  const [search, setSearch] = useState('');

  function handleAdd(location: RawLocation) {
    addItem(location);
    setSelected(location.id);
  }

  const q = search.trim().toLowerCase();
  const filtered = (
    q
      ? locationIds.filter(
          (id) =>
            id.toLowerCase().includes(q) ||
            locations[id].name.toLowerCase().includes(q),
        )
      : locationIds
  ).map((id) => locations[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddLocationDialog onAdd={handleAdd} locationIds={locationIds} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search locations…"
        count={filtered.length}
        total={locationIds.length}
      />
      <DataList
        items={filtered}
        getKey={(l) => l.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={locationIds}
        onClone={(l, newId) => handleClone(l.id, newId)}
        onDelete={(l) => {
          handleDelete(l.id);
        }}
        getReferences={(l) => referencesFor(l.id)}
        renderItem={(l) => (
          <>
            <p className="text-xs font-mono truncate">{l.id}</p>
            <p className="text-xs text-zinc-500 truncate">
              {l.name}
              {l.parent ? ` · ${l.parent}` : ''}
            </p>
          </>
        )}
        emptyText="No locations match."
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
        <LocationDetail
          key={selected}
          location={locations[selected]}
          onChange={(updated) => {
            handleChange(selected, updated);
          }}
          locationIds={locationIds}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a location</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching locations will discard them."
      />
    </PanelLayout>
  );
}

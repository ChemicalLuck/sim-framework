import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@chemicalluck/sim-engine/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import { Textarea } from '@chemicalluck/sim-engine/components/ui/textarea';
import { ActionGroupsEditor } from '@chemicalluck/sim-engine/editor/components/action-groups-editor';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/sim-engine/editor/components/panel-layout';
import { ReferencedBy } from '@chemicalluck/sim-engine/editor/components/referenced-by';
import {
  type AvailableData,
  useAvailableData,
} from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import { usePanelEntries } from '@chemicalluck/sim-engine/editor/lib/use-panel-entries';
import { getCurrencySymbol } from '@chemicalluck/sim-engine/features/money/lib/currency';
import type { WearableConfig } from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import type {
  Coverage,
  InventoryItem,
  ItemFields,
  Slot,
  Style,
} from '@chemicalluck/sim-engine/types/item.types';

type KindFilter = 'all' | 'item' | 'wearable';

// ── Add Item dialog ──────────────────────────────────────────────

interface AddItemDialogProps {
  onAdd: (item: InventoryItem) => void;
  slots: string[];
}

function AddItemDialog({ onAdd, slots }: AddItemDialogProps) {
  const form = useForm<{
    id: string;
    name: string;
    kind: 'item' | 'wearable';
    description: string;
    value: string;
    slot: Slot;
  }>({
    defaultValues: {
      id: '',
      name: '',
      kind: 'item',
      description: '',
      value: '',
      slot: slots[0] ?? '',
    },
  });

  const kind = form.watch('kind');

  function submit() {
    void form.handleSubmit(
      ({ id, name, kind: k, description, value, slot }) => {
        const base: ItemFields = {
          id: id.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          value: value !== '' ? parseFloat(value) : undefined,
        };
        const item: InventoryItem =
          k === 'wearable'
            ? { ...base, kind: 'wearable', slot, appearance: {} }
            : { ...base, kind: 'item' };
        onAdd(item);
        form.reset();
      },
    )();
  }

  return (
    <AddDialog
      label="New Item"
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
                <Input {...field} placeholder="item_bread" autoFocus />
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
                <Input {...field} placeholder="Bread" />
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
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="item">Item</SelectItem>
                  <SelectItem value="wearable">Wearable</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={`value (${getCurrencySymbol()})`}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="description (optional)" />
              </FormControl>
            </FormItem>
          )}
        />
        {kind === 'wearable' && (
          <FormField
            control={form.control}
            name="slot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slot</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slots.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}
      </Form>
    </AddDialog>
  );
}

// ── Item detail ──────────────────────────────────────────────────

interface DetailFormValues {
  name: string;
  description: string;
  value: string;
  slot: string;
  style: Style;
  coverage: '' | '0' | '1' | '2';
}

interface ItemDetailProps {
  item: InventoryItem;
  onChange: (updated: InventoryItem) => void;
  refs: string[];
  slots: string[];
  styles: string[];
  appearanceKeys: string[];
  availableData: AvailableData;
}

function ItemDetail({
  item,
  onChange,
  refs,
  slots,
  styles,
  appearanceKeys,
  availableData,
}: ItemDetailProps) {
  const isWearable = item.kind === 'wearable';
  const baseAppearance = isWearable ? item.appearance : {};

  const form = useForm<DetailFormValues>({
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      value: String(item.value ?? ''),
      slot: isWearable ? item.slot : '',
      style: isWearable ? (item.style ?? '') : '',
      coverage:
        isWearable && item.coverage != null
          ? (String(item.coverage) as '0' | '1' | '2')
          : '',
    },
  });

  const [appearance, setAppearance] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(baseAppearance).map(([k, v]) => [k, v ?? '']),
    ),
  );

  function commitToParent(overrideAppearance?: Record<string, string>) {
    const { name, description, value, slot, style, coverage } =
      form.getValues();
    const base = {
      ...item,
      name: name || item.name,
      description: description.trim() || undefined,
      value: value !== '' ? parseFloat(value) : undefined,
    };
    if (item.kind !== 'wearable') {
      onChange(base as InventoryItem);
      return;
    }
    const app = overrideAppearance ?? appearance;
    const newAppearance: Record<string, string> = {};
    for (const [k, v] of Object.entries(app)) {
      if (v.trim()) newAppearance[k] = v.trim();
    }
    onChange({
      ...base,
      kind: 'wearable',
      slot: slot || item.slot,
      style: style || undefined,
      coverage: coverage !== '' ? (parseInt(coverage) as Coverage) : undefined,
      appearance: newAppearance,
    });
  }

  function handleAppearanceChange(key: string, val: string) {
    const next = { ...appearance, [key]: val };
    setAppearance(next);
    commitToParent(next);
  }

  return (
    <Form {...form}>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      commitToParent();
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value ({getCurrencySymbol()})</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onBlur={() => {
                      field.onBlur();
                      commitToParent();
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    commitToParent();
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isWearable && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="slot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slot</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        commitToParent();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {slots.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        commitToParent();
                      }}
                    >
                      <FormControl>
                        <SelectTrigger size="sm">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0 — none</SelectItem>
                        <SelectItem value="1">1 — partial</SelectItem>
                        <SelectItem value="2">2 — full</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      commitToParent();
                    }}
                  >
                    <FormControl>
                      <SelectTrigger size="sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {styles.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div>
              <p className="text-sm font-medium mb-2">Appearance</p>
              <div className="grid grid-cols-2 gap-2">
                {appearanceKeys.map((key) => (
                  <FormItem key={key}>
                    <FormLabel className="capitalize">{key}</FormLabel>
                    <FormControl>
                      <Input
                        value={appearance[key] ?? ''}
                        onChange={(e) => {
                          handleAppearanceChange(key, e.target.value);
                        }}
                        placeholder="—"
                      />
                    </FormControl>
                  </FormItem>
                ))}
              </div>
            </div>
          </>
        )}

        <ReferencedBy refs={refs} />

        <ActionGroupsEditor
          groups={item.actions ?? []}
          onChange={(groups) => {
            onChange({
              ...item,
              actions: groups.length ? groups : undefined,
            } as InventoryItem);
          }}
          availableData={availableData}
        />
      </FieldGroup>
    </Form>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function ItemsPanel() {
  const availableData = useAvailableData();
  const {
    items,
    ids: itemIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange: changeItem,
    handleAdd: addItem,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<InventoryItem>({ saveMessage: 'Items saved' });
  const { data: cfg } = useEditorData<WearableConfig | null>(
    '/editor/api/data/wearables-config',
  );
  const slots = cfg?.slots ?? [];
  const styles = cfg?.styles ?? [];
  const appearanceKeys = cfg?.appearanceKeys ?? [];

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.values(items).filter((it) => {
      if (kindFilter !== 'all' && it.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        it.id.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        (it.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, search, kindFilter]);

  function handleChange(updated: InventoryItem) {
    changeItem(updated.id, updated);
  }

  function handleAdd(item: InventoryItem) {
    addItem(item);
    setSelected(item.id);
  }

  const activeItem = selected ? (items[selected] ?? null) : null;

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddItemDialog onAdd={handleAdd} slots={slots} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search items..."
        count={filtered.length}
        total={itemIds.length}
      >
        <Field>
          <Select
            value={kindFilter}
            onValueChange={(v) => {
              setKindFilter(v as KindFilter);
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="wearable">Wearable</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SidebarToolbar>

      <DataList
        items={filtered}
        getKey={(it) => it.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={itemIds}
        onClone={(it, newId) => handleClone(it.id, newId)}
        onDelete={(it) => {
          handleDelete(it.id);
        }}
        getReferences={(it) => referencesFor(it.id)}
        renderItem={(it) => (
          <>
            <div className="flex items-center gap-2">
              <p className="text-sm truncate flex-1">{it.name}</p>
              <Badge variant="secondary">{it.kind}</Badge>
            </div>
            <p className="text-xs font-mono truncate text-zinc-500">{it.id}</p>
          </>
        )}
        emptyText="No items match."
      />
    </>
  );

  return (
    <PanelLayout
      sidebar={sidebar}
      entityId={activeItem?.id ?? undefined}
      onRename={
        selected
          ? (newId) => {
              void rename(selected, newId);
            }
          : undefined
      }
      references={selected ? referencesFor(selected) : undefined}
    >
      {activeItem ? (
        <ItemDetail
          key={activeItem.id}
          item={activeItem}
          onChange={handleChange}
          refs={referencesFor(activeItem.id)}
          slots={slots}
          styles={styles}
          appearanceKeys={appearanceKeys}
          availableData={availableData}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select an item</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching items will discard them."
      />
    </PanelLayout>
  );
}

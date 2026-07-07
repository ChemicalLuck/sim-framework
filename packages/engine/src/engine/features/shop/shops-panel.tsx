import { X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@chemicalluck/engine/editor/components/panel-layout';
import { ReferencedBy } from '@chemicalluck/engine/editor/components/referenced-by';
import { editorTemplateContext } from '@chemicalluck/engine/editor/components/template-context';
import { TemplateEditor } from '@chemicalluck/engine/editor/components/template-editor';
import { useAddForm } from '@chemicalluck/engine/editor/lib/use-add-form';
import { usePanelEntries } from '@chemicalluck/engine/editor/lib/use-panel-entries';

type RawShopEntry =
  | { kind: 'item'; itemId: string }
  | { kind: 'wearable'; wearableId: string }
  | { kind: 'template'; templateId: string };

interface RawShopTab {
  title: string;
  items: RawShopEntry[];
}

interface RawShop {
  id: string;
  text: string;
  tabs: RawShopTab[];
}

function entryId(entry: RawShopEntry): string {
  if (entry.kind === 'item') return entry.itemId;
  if (entry.kind === 'wearable') return entry.wearableId;
  return entry.templateId;
}

// ── Add Shop dialog ──────────────────────────────────────────────

interface AddShopDialogProps {
  onAdd: (shop: RawShop) => void;
}

function AddShopDialog({ onAdd }: AddShopDialogProps) {
  const { form, submit } = useAddForm(
    { id: '', text: '', tabTitle: '' },
    ({ id, text, tabTitle }) => {
      onAdd({
        id: id.trim(),
        text: text.trim(),
        tabs: [{ title: tabTitle.trim() || 'Items', items: [] }],
      });
    },
  );

  return (
    <AddDialog
      label="New Shop"
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
                <Input {...field} placeholder="shop_market" autoFocus />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Welcome to the market…" />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tabTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First tab title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Items" />
              </FormControl>
            </FormItem>
          )}
        />
      </Form>
    </AddDialog>
  );
}

// ── Shop entry row ───────────────────────────────────────────────

interface ShopEntryRowProps {
  entry: RawShopEntry;
  onRemove: () => void;
}

function ShopEntryRow({ entry, onRemove }: ShopEntryRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md">
      <span
        className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
          entry.kind === 'item'
            ? 'bg-zinc-700 text-zinc-300'
            : entry.kind === 'wearable'
              ? 'bg-purple-900 text-purple-300'
              : 'bg-blue-900 text-blue-300'
        }`}
      >
        {entry.kind}
      </span>
      <code className="flex-1 text-sm text-white truncate">
        {entryId(entry)}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400 shrink-0"
        aria-label="Remove"
      >
        <X size={12} />
      </Button>
    </div>
  );
}

// ── Add entry form ───────────────────────────────────────────────

interface AddEntryFormProps {
  onAdd: (entry: RawShopEntry) => void;
}

function AddEntryForm({ onAdd }: AddEntryFormProps) {
  const form = useForm<{ kind: RawShopEntry['kind']; id: string }>({
    defaultValues: { kind: 'item', id: '' },
  });

  function submit() {
    void form.handleSubmit(({ kind: k, id }) => {
      const trimId = id.trim();
      const entry: RawShopEntry =
        k === 'item'
          ? { kind: 'item', itemId: trimId }
          : k === 'wearable'
            ? { kind: 'wearable', wearableId: trimId }
            : { kind: 'template', templateId: trimId };
      onAdd(entry);
      form.setValue('id', '');
    })();
  }

  return (
    <Form {...form}>
      <div className="flex items-center gap-1 mt-2">
        <FormField
          control={form.control}
          name="kind"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                size="sm"
                className="w-24 shrink-0 bg-zinc-800 border-zinc-600 h-7 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="item">item</SelectItem>
                <SelectItem value="wearable">wearable</SelectItem>
                <SelectItem value="template">template</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormControl>
              <Input
                {...field}
                placeholder="id"
                className="h-7 text-xs bg-zinc-800 border-zinc-600 flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            </FormControl>
          )}
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={!form.watch('id').trim()}
          className="h-7 text-xs px-3 shrink-0"
        >
          +
        </Button>
      </div>
    </Form>
  );
}

// ── Shop detail ──────────────────────────────────────────────────

interface ShopDetailProps {
  shop: RawShop;
  onChange: (updated: RawShop) => void;
  refs: string[];
}

function ShopDetail({ shop, onChange, refs }: ShopDetailProps) {
  const [addingTab, setAddingTab] = useState(false);
  const [newTabTitle, setNewTabTitle] = useState('');

  function removeEntry(tabIdx: number, entryIdx: number) {
    onChange({
      ...shop,
      tabs: shop.tabs.map((tab, ti) =>
        ti === tabIdx
          ? { ...tab, items: tab.items.filter((_, ei) => ei !== entryIdx) }
          : tab,
      ),
    });
  }

  function addEntry(tabIdx: number, entry: RawShopEntry) {
    onChange({
      ...shop,
      tabs: shop.tabs.map((tab, ti) =>
        ti === tabIdx ? { ...tab, items: [...tab.items, entry] } : tab,
      ),
    });
  }

  function addTab() {
    const title = newTabTitle.trim();
    if (!title) return;
    onChange({ ...shop, tabs: [...shop.tabs, { title, items: [] }] });
    setNewTabTitle('');
    setAddingTab(false);
  }

  function removeTab(tabIdx: number) {
    onChange({ ...shop, tabs: shop.tabs.filter((_, ti) => ti !== tabIdx) });
  }

  return (
    <FieldGroup>
      <Field>
        <Label>Description</Label>
        <TemplateEditor
          value={shop.text}
          onChange={(v) => {
            onChange({ ...shop, text: v });
          }}
          context={editorTemplateContext()}
        />
      </Field>

      <ReferencedBy refs={refs} />

      {shop.tabs.map((tab, tabIdx) => (
        <div key={tab.title} className="space-y-2">
          <div className="flex items-center gap-2 border-b border-zinc-700 pb-1">
            <h4 className="text-sm font-medium text-zinc-300 flex-1">
              {tab.title} ({tab.items.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                removeTab(tabIdx);
              }}
              className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400"
              title="Remove tab"
            >
              <X size={12} />
            </Button>
          </div>
          <div className="space-y-1">
            {tab.items.length === 0 ? (
              <p className="text-xs text-zinc-500 italic px-2">No items</p>
            ) : (
              tab.items.map((entry, ei) => (
                <ShopEntryRow
                  key={entryId(entry)}
                  entry={entry}
                  onRemove={() => {
                    removeEntry(tabIdx, ei);
                  }}
                />
              ))
            )}
          </div>
          <AddEntryForm
            onAdd={(entry) => {
              addEntry(tabIdx, entry);
            }}
          />
        </div>
      ))}

      <div className="pt-2 border-t border-zinc-800">
        {addingTab ? (
          <div className="flex items-center gap-1">
            <Input
              value={newTabTitle}
              onChange={(e) => {
                setNewTabTitle(e.target.value);
              }}
              placeholder="Tab title"
              className="h-7 text-xs bg-zinc-800 border-zinc-600 flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTab();
                if (e.key === 'Escape') {
                  setAddingTab(false);
                }
              }}
            />
            <Button
              size="sm"
              onClick={addTab}
              disabled={!newTabTitle.trim()}
              className="h-7 text-xs px-3"
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingTab(false);
              }}
              className="h-7 text-xs text-zinc-500 hover:text-zinc-300"
            >
              <X size={12} />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddingTab(true);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            + Add tab
          </button>
        )}
      </div>
    </FieldGroup>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function ShopsPanel() {
  const {
    items: shops,
    ids: shopIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange: changeShop,
    handleAdd: addShop,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawShop>({ saveMessage: 'Shops saved' });
  const [search, setSearch] = useState('');

  function handleShopChange(updated: RawShop) {
    changeShop(updated.id, updated);
  }

  function handleAddShop(shop: RawShop) {
    addShop(shop);
    setSelected(shop.id);
  }

  const q = search.trim().toLowerCase();
  const filteredShops = (
    q
      ? shopIds.filter((id) => {
          const shop = shops[id];
          return (
            id.toLowerCase().includes(q) ||
            shop.text.toLowerCase().includes(q) ||
            shop.tabs.some((t) => t.title.toLowerCase().includes(q))
          );
        })
      : shopIds
  ).map((id) => shops[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddShopDialog onAdd={handleAddShop} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search shops..."
        count={filteredShops.length}
        total={shopIds.length}
      />
      <DataList
        items={filteredShops}
        getKey={(s) => s.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={shopIds}
        onClone={(s, newId) => handleClone(s.id, newId)}
        onDelete={(s) => {
          handleDelete(s.id);
        }}
        getReferences={(s) => referencesFor(s.id)}
        renderItem={(shop) => (
          <>
            <p className="text-sm truncate">{shop.id}</p>
            {shop.text && (
              <p className="text-xs text-zinc-500 truncate italic">
                {shop.text}
              </p>
            )}
          </>
        )}
        emptyText="No shops match."
      />
    </>
  );

  return (
    <PanelLayout
      sidebarWidth="w-52"
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
        <ShopDetail
          key={selected}
          shop={shops[selected]}
          onChange={handleShopChange}
          refs={referencesFor(selected)}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a shop</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching shops will discard them."
      />
    </PanelLayout>
  );
}

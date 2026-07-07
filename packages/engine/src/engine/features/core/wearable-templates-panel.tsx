import { X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import {
  AddDialog,
  ConfirmDialog,
  DataList,
  PanelLayout,
  SidebarToolbar,
} from '@sim/engine/editor/components/panel-layout';
import { useAddForm } from '@sim/engine/editor/lib/use-add-form';
import { usePanelEntries } from '@sim/engine/editor/lib/use-panel-entries';
import {
  getSizeSystems,
  getSlots,
  getStyles,
} from '@sim/engine/features/outfits/lib/wearable-config';

interface RawTemplate {
  id: string;
  name: string;
  slot: string;
  style: string;
  value: number;
  coverage?: number;
  options: Record<string, string[]>;
  sizeSystem?: string;
}

const NO_SIZE_SYSTEM = '__none__';
const ALL_FILTER = '__all__';

// ── Add Template dialog ───────────────────────────────────────────

interface AddTemplateDialogProps {
  onAdd: (template: RawTemplate) => void;
}

function AddTemplateDialog({ onAdd }: AddTemplateDialogProps) {
  const { form, submit } = useAddForm(
    { id: '', name: '', slot: 'baselayer', style: 'casual' },
    ({ id, name, slot, style }) => {
      onAdd({
        id: id.trim(),
        name: name.trim(),
        slot,
        style,
        value: 20,
        coverage: 1,
        options: { color1: ['Black', 'White'] },
      });
    },
  );

  return (
    <AddDialog
      label="New Template"
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
                <Input {...field} placeholder="tShirt" autoFocus />
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
                <Input {...field} placeholder="T-Shirt" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3">
          <FormField
            control={form.control}
            name="slot"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Slot</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getSlots().map((s) => (
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
            name="style"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Style</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getStyles().map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </Form>
    </AddDialog>
  );
}

// ── Option row ────────────────────────────────────────────────────

interface OptionRowProps {
  optionKey: string;
  values: string[];
  onChange: (values: string[]) => void;
  onRemoveKey: () => void;
}

function OptionRow({
  optionKey,
  values,
  onChange,
  onRemoveKey,
}: OptionRowProps) {
  const [newValue, setNewValue] = useState('');

  function addValue() {
    const v = newValue.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setNewValue('');
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <code className="text-xs text-zinc-300 font-mono flex-1">
          {optionKey}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveKey}
          className="h-5 w-5 p-0 text-zinc-600 hover:text-red-400 shrink-0"
        >
          <X size={10} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {values.map((v) => (
          <span
            key={v}
            className="flex items-center gap-1 text-xs bg-zinc-700 text-zinc-200 px-2 py-0.5 rounded"
          >
            {v}
            <button
              onClick={() => {
                onChange(values.filter((x) => x !== v));
              }}
              className="text-zinc-500 hover:text-red-400 leading-none"
            >
              <X size={8} />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={newValue}
            onChange={(e) => {
              setNewValue(e.target.value);
            }}
            placeholder="+ value"
            className="h-5 text-xs bg-zinc-800 border-zinc-600 w-20 px-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addValue();
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={addValue}
            disabled={!newValue.trim()}
            className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Template detail ───────────────────────────────────────────────

interface TemplateDetailProps {
  template: RawTemplate;
  onChange: (updated: RawTemplate) => void;
}

function TemplateDetail({ template, onChange }: TemplateDetailProps) {
  const [newOptionKey, setNewOptionKey] = useState('');

  function addOptionKey() {
    const key = newOptionKey.trim();
    if (!key || key in template.options) return;
    onChange({ ...template, options: { ...template.options, [key]: [] } });
    setNewOptionKey('');
  }

  return (
    <FieldGroup>
      <Field>
        <Label>Name</Label>
        <Input
          value={template.name}
          onChange={(e) => {
            onChange({ ...template, name: e.target.value });
          }}
        />
      </Field>

      <div className="flex gap-4">
        <Field className="flex-1">
          <Label>Slot</Label>
          <Select
            value={template.slot}
            onValueChange={(slot) => {
              onChange({ ...template, slot });
            }}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getSlots().map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field className="flex-1">
          <Label>Style</Label>
          <Select
            value={template.style}
            onValueChange={(style) => {
              onChange({ ...template, style });
            }}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getStyles().map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex gap-4">
        <Field className="flex-1">
          <Label>Value (£)</Label>
          <Input
            type="number"
            min="0"
            value={template.value}
            onChange={(e) => {
              onChange({ ...template, value: parseInt(e.target.value) || 0 });
            }}
            className="bg-zinc-800 border-zinc-600"
          />
        </Field>

        <Field className="flex-1">
          <Label>Coverage</Label>
          <Input
            type="number"
            min="0"
            max="3"
            value={template.coverage ?? 1}
            onChange={(e) => {
              onChange({
                ...template,
                coverage: parseInt(e.target.value) || 1,
              });
            }}
            className="bg-zinc-800 border-zinc-600"
          />
        </Field>

        <Field className="flex-1">
          <Label>Size System</Label>
          <Select
            value={template.sizeSystem ?? NO_SIZE_SYSTEM}
            onValueChange={(value) => {
              onChange({
                ...template,
                sizeSystem: value === NO_SIZE_SYSTEM ? undefined : value,
              });
            }}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-600">
              <SelectValue placeholder="— none —" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SIZE_SYSTEM}>— none —</SelectItem>
              {Object.keys(getSizeSystems()).map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <Label>Appearance options</Label>
        <div className="space-y-3 mt-1">
          {Object.entries(template.options).map(([key, vals]) => (
            <OptionRow
              key={key}
              optionKey={key}
              values={vals}
              onChange={(values) => {
                onChange({
                  ...template,
                  options: { ...template.options, [key]: values },
                });
              }}
              onRemoveKey={() => {
                const rest = Object.fromEntries(
                  Object.entries(template.options).filter(([k]) => k !== key),
                );
                onChange({ ...template, options: rest });
              }}
            />
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
            <Input
              value={newOptionKey}
              onChange={(e) => {
                setNewOptionKey(e.target.value);
              }}
              placeholder="New option key (e.g. color2)"
              className="h-7 text-xs bg-zinc-800 border-zinc-600 flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addOptionKey();
              }}
            />
            <Button
              size="sm"
              onClick={addOptionKey}
              disabled={!newOptionKey.trim()}
              className="h-7 text-xs shrink-0"
            >
              + Add
            </Button>
          </div>
        </div>
      </Field>
    </FieldGroup>
  );
}

// ── Main panel ────────────────────────────────────────────────────

export function WearableTemplatesPanel() {
  const {
    items: templates,
    ids: templateIds,
    selected,
    setSelected,
    confirmSelect,
    confirmState,
    handleChange,
    handleAdd: addTemplate,
    handleClone,
    handleDelete,
    rename,
    referencesFor,
  } = usePanelEntries<RawTemplate>({ saveMessage: 'Templates saved' });
  const [search, setSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState(ALL_FILTER);
  const [styleFilter, setStyleFilter] = useState(ALL_FILTER);

  function handleAdd(template: RawTemplate) {
    addTemplate(template);
    setSelected(template.id);
  }
  const q = search.trim().toLowerCase();
  const filtered = templateIds
    .filter((id) => {
      const t = templates[id];
      if (slotFilter !== ALL_FILTER && t.slot !== slotFilter) return false;
      if (styleFilter !== ALL_FILTER && t.style !== styleFilter) return false;
      if (!q) return true;
      return (
        id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.slot.toLowerCase().includes(q)
      );
    })
    .map((id) => templates[id]);

  const sidebar = (
    <>
      <SidebarToolbar
        add={<AddTemplateDialog onAdd={handleAdd} />}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search templates…"
        count={filtered.length}
        total={templateIds.length}
      >
        <div className="flex gap-2">
          <Select value={slotFilter} onValueChange={setSlotFilter}>
            <SelectTrigger size="sm" className="flex-1 h-7">
              <SelectValue placeholder="Slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All slots</SelectItem>
              {getSlots().map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={styleFilter} onValueChange={setStyleFilter}>
            <SelectTrigger size="sm" className="flex-1 h-7">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER}>All styles</SelectItem>
              {getStyles().map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SidebarToolbar>
      <DataList
        items={filtered}
        getKey={(t) => t.id}
        selected={selected}
        onSelect={(id) => {
          confirmSelect(() => {
            setSelected(id);
          });
        }}
        allKeys={templateIds}
        onClone={(t, newId) => handleClone(t.id, newId)}
        onDelete={(t) => {
          handleDelete(t.id);
        }}
        getReferences={(t) => referencesFor(t.id)}
        renderItem={(t) => (
          <>
            <p className="text-xs font-mono truncate">{t.id}</p>
            <p className="text-xs text-zinc-500 truncate">
              {t.name} · {t.slot} · {t.style}
            </p>
          </>
        )}
        emptyText="No templates match."
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
        <TemplateDetail
          key={selected}
          template={templates[selected]}
          onChange={(updated) => {
            handleChange(selected, updated);
          }}
        />
      ) : (
        <p className="text-zinc-500 text-sm">Select a template</p>
      )}
      <ConfirmDialog
        {...confirmState}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Switching templates will discard them."
      />
    </PanelLayout>
  );
}

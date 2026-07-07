/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import { Input } from '@sim/engine/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import { useRegisterSave } from '@sim/engine/editor/lib/save-context';
import { useReportDirty } from '@sim/engine/editor/lib/unsaved-changes';
import { useEditorData } from '@sim/engine/editor/lib/use-editor-data';

interface WearablesCfg {
  slots: string[];
  categories: string[];
  slotCategoryMap: Record<string, string>;
  slotConflicts?: Record<string, string[]>;
  styles: string[];
  appearanceKeys: string[];
  primaryBodyAttributes?: string[];
  estimatedMetrics?: Record<string, unknown>;
  sizeSystems?: Record<string, unknown>;
}

interface JsonEditorProps {
  value: unknown;
  onChange: (v: Record<string, unknown>) => void;
}

/** Edits an arbitrary JSON object as text, surfacing parse errors. */
function JsonEditor({ value, onChange }: JsonEditorProps) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1.5">
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          try {
            onChange(JSON.parse(next) as Record<string, unknown>);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid JSON');
          }
        }}
        className={`w-full h-64 text-xs font-mono bg-zinc-800 border rounded p-2 text-zinc-200 ${
          error ? 'border-red-500' : 'border-zinc-600'
        }`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface StringListEditorProps {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

function StringListEditor({
  values,
  onChange,
  placeholder = 'Add...',
}: StringListEditorProps) {
  const [newVal, setNewVal] = useState('');

  function add() {
    const trimmed = newVal.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setNewVal('');
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <div
            key={v}
            className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs font-mono text-zinc-200"
          >
            {v}
            <button
              onClick={() => {
                onChange(values.filter((x) => x !== v));
              }}
              className="text-zinc-500 hover:text-red-400 ml-1 leading-none"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newVal}
          onChange={(e) => {
            setNewVal(e.target.value);
          }}
          placeholder={placeholder}
          className="h-7 text-sm bg-zinc-800 border-zinc-600 flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
        />
        <Button
          size="sm"
          onClick={add}
          disabled={!newVal.trim()}
          className="h-7 shrink-0"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

interface SlotConflictsEditorProps {
  slots: string[];
  conflicts: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
}

/**
 * Per-slot editor for mutual-exclusion. The authored map is one-directional but
 * resolved symmetrically at runtime, so each relationship only needs adding
 * once (e.g. `full-body` → `baselayer` also blocks `baselayer` → `full-body`).
 */
function SlotConflictsEditor({
  slots,
  conflicts,
  onChange,
}: SlotConflictsEditorProps) {
  function setFor(slot: string, values: string[]) {
    const next = Object.fromEntries(
      Object.entries(conflicts).filter(([k]) => k !== slot),
    );
    if (values.length > 0) next[slot] = values;
    onChange(next);
  }

  return (
    <div className="space-y-1.5">
      {slots.map((slot) => {
        const current = conflicts[slot] ?? [];
        const available = slots.filter(
          (s) => s !== slot && !current.includes(s),
        );
        return (
          <div key={slot} className="flex items-start gap-2">
            <span className="text-sm font-mono text-zinc-200 w-32 shrink-0 pt-1">
              {slot}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {current.map((c) => (
                <div
                  key={c}
                  className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs font-mono text-zinc-200"
                >
                  {c}
                  <button
                    onClick={() => {
                      setFor(
                        slot,
                        current.filter((x) => x !== c),
                      );
                    }}
                    className="text-zinc-500 hover:text-red-400 ml-1 leading-none"
                    aria-label={`Remove conflict ${c}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {available.length > 0 && (
                <Select
                  value=""
                  onValueChange={(v) => {
                    setFor(slot, [...current, v]);
                  }}
                >
                  <SelectTrigger size="sm" className="h-7 w-40">
                    <SelectValue placeholder="+ conflicting slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WearablesConfigPanel() {
  const {
    data: cfg,
    saving,
    save,
  } = useEditorData<WearablesCfg>('/editor/api/data/wearables-config');

  const [slots, setSlots] = useState<string[]>(cfg.slots);
  const [categories, setCategories] = useState<string[]>(cfg.categories);
  const [slotCategoryMap, setSlotCategoryMap] = useState<
    Record<string, string>
  >(cfg.slotCategoryMap);
  const [slotConflicts, setSlotConflicts] = useState<Record<string, string[]>>(
    cfg.slotConflicts ?? {},
  );
  const [styles, setStyles] = useState<string[]>(cfg.styles);
  const [appearanceKeys, setAppearanceKeys] = useState<string[]>(
    cfg.appearanceKeys,
  );
  const [primaryBodyAttributes, setPrimaryBodyAttributes] = useState<string[]>(
    cfg.primaryBodyAttributes ?? [],
  );
  const [estimatedMetrics, setEstimatedMetrics] = useState<
    Record<string, unknown>
  >(cfg.estimatedMetrics ?? {});
  const [sizeSystems, setSizeSystems] = useState<Record<string, unknown>>(
    cfg.sizeSystems ?? {},
  );
  const [newSlot, setNewSlot] = useState('');

  const dirty = useMemo(
    () =>
      JSON.stringify({
        slots,
        categories,
        slotCategoryMap,
        slotConflicts,
        styles,
        appearanceKeys,
        primaryBodyAttributes,
        estimatedMetrics,
        sizeSystems,
      }) !==
      JSON.stringify({
        slots: cfg.slots,
        categories: cfg.categories,
        slotCategoryMap: cfg.slotCategoryMap,
        slotConflicts: cfg.slotConflicts ?? {},
        styles: cfg.styles,
        appearanceKeys: cfg.appearanceKeys,
        primaryBodyAttributes: cfg.primaryBodyAttributes ?? [],
        estimatedMetrics: cfg.estimatedMetrics ?? {},
        sizeSystems: cfg.sizeSystems ?? {},
      }),
    [
      slots,
      categories,
      slotCategoryMap,
      slotConflicts,
      styles,
      appearanceKeys,
      primaryBodyAttributes,
      estimatedMetrics,
      sizeSystems,
      cfg,
    ],
  );

  function discard() {
    setSlots(cfg.slots);
    setCategories(cfg.categories);
    setSlotCategoryMap(cfg.slotCategoryMap);
    setSlotConflicts(cfg.slotConflicts ?? {});
    setStyles(cfg.styles);
    setAppearanceKeys(cfg.appearanceKeys);
    setPrimaryBodyAttributes(cfg.primaryBodyAttributes ?? []);
    setEstimatedMetrics(cfg.estimatedMetrics ?? {});
    setSizeSystems(cfg.sizeSystems ?? {});
  }

  function handleAddSlot(slot: string) {
    if (slots.includes(slot)) return;
    setSlots([...slots, slot]);
    setSlotCategoryMap((prev) => ({ ...prev, [slot]: '' }));
  }

  function handleRemoveSlot(slot: string) {
    setSlots((prev) => prev.filter((s) => s !== slot));
    setSlotCategoryMap((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k !== slot)),
    );
    setSlotConflicts((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (k === slot) continue;
        const pruned = v.filter((s) => s !== slot);
        if (pruned.length > 0) next[k] = pruned;
      }
      return next;
    });
  }

  function addSlot() {
    const trimmed = newSlot.trim();
    if (!trimmed) return;
    handleAddSlot(trimmed);
    setNewSlot('');
  }

  function doSave() {
    void save(
      {
        slots,
        categories,
        slotCategoryMap,
        slotConflicts,
        styles,
        appearanceKeys,
        primaryBodyAttributes,
        estimatedMetrics,
        sizeSystems,
      },
      'Wearable config saved',
    );
  }

  useReportDirty({ dirty, discard });
  useRegisterSave({ save: doSave, saving });

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h2 className="text-sm font-semibold text-white">Wearable Config</h2>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Wearable Slots
        </h3>
        <div className="space-y-2">
          <div className="space-y-1.5">
            {slots.map((slot) => (
              <div key={slot} className="flex items-center gap-2">
                <span className="text-sm font-mono text-zinc-200 w-32 shrink-0">
                  {slot}
                </span>
                <Select
                  value={slotCategoryMap[slot] || '__none__'}
                  onValueChange={(v) => {
                    setSlotCategoryMap((prev) => ({
                      ...prev,
                      [slot]: v === '__none__' ? '' : v,
                    }));
                  }}
                >
                  <SelectTrigger size="sm" className="flex-1 h-7">
                    <SelectValue placeholder="— category —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— none —</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => {
                    handleRemoveSlot(slot);
                  }}
                  className="text-zinc-500 hover:text-red-400 text-sm w-5 shrink-0"
                  aria-label={`Remove slot ${slot}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSlot}
              onChange={(e) => {
                setNewSlot(e.target.value);
              }}
              placeholder="New slot name..."
              className="h-7 text-sm bg-zinc-800 border-zinc-600 flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSlot();
              }}
            />
            <Button
              size="sm"
              onClick={addSlot}
              disabled={!newSlot.trim()}
              className="h-7 shrink-0"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Categories
        </h3>
        <StringListEditor
          values={categories}
          onChange={(vals) => {
            const removed = categories.filter((c) => !vals.includes(c));
            setCategories(vals);
            if (removed.length > 0) {
              setSlotCategoryMap((prev) => {
                const next = { ...prev };
                for (const key of Object.keys(next)) {
                  if (removed.includes(next[key])) next[key] = '';
                }
                return next;
              });
            }
          }}
          placeholder="New category..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Slot Conflicts
        </h3>
        <p className="text-xs text-zinc-500">
          Slots that cannot be worn at the same time. Equipping one clears the
          others. Relationships are symmetric, so only add each pairing once
          (e.g. a full-body dress clearing the baselayer and legwear).
        </p>
        <SlotConflictsEditor
          slots={slots}
          conflicts={slotConflicts}
          onChange={setSlotConflicts}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Styles
        </h3>
        <StringListEditor
          values={styles}
          onChange={setStyles}
          placeholder="New style..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Appearance Keys
        </h3>
        <StringListEditor
          values={appearanceKeys}
          onChange={setAppearanceKeys}
          placeholder="New key (e.g. color1)..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Primary Body Attributes
        </h3>
        <StringListEditor
          values={primaryBodyAttributes}
          onChange={setPrimaryBodyAttributes}
          placeholder="New attribute (e.g. height)..."
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Estimated Metrics
        </h3>
        <p className="text-xs text-zinc-500">
          Gender-aware linear models estimating measurements from the primary
          attributes.
        </p>
        <JsonEditor value={estimatedMetrics} onChange={setEstimatedMetrics} />
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Size Systems
        </h3>
        <p className="text-xs text-zinc-500">
          Each system has one or more dimensions (single scale, or compound like
          trousers waist/length and bras band/cup) and a labelFormat.
        </p>
        <JsonEditor value={sizeSystems} onChange={setSizeSystems} />
      </div>
    </div>
  );
}

export default {
  panels: {
    'wearables-config': {
      label: 'Wearable Config',
      group: 'Core',
      component: WearablesConfigPanel,
    },
  },
};

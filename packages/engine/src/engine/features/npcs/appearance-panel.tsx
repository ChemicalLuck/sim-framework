import { useState } from 'react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { TemplateEditor } from '@chemicalluck/sim-engine/editor/components/template-editor';
import { useRegisterSave } from '@chemicalluck/sim-engine/editor/lib/save-context';
import { useReportDirty } from '@chemicalluck/sim-engine/editor/lib/unsaved-changes';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import { getMacros, getTerms } from '@chemicalluck/sim-engine/features/linguistics/lib/config';
import type { TemplateLintContext } from '@chemicalluck/sim-engine/features/linguistics/lib/lint';
import { baseTemplateVariableNames } from '@chemicalluck/sim-engine/features/linguistics/lib/variables';
import type {
  AppearanceFeatureDefinition,
  AppearanceJsonData,
  BodyAttributeDefinition,
  NormalDistParams,
} from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';

// ── Tiny UI helpers ───────────────────────────────────────────────────────────

function Label({ children }: React.PropsWithChildren) {
  return (
    <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
      {children}
    </span>
  );
}

function SectionTitle({ children }: React.PropsWithChildren) {
  return (
    <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-700 pb-1 mb-3">
      {children}
    </h3>
  );
}

function WeightInput({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <Input
      type="number"
      value={value ?? 0}
      onChange={(e) => {
        onChange(Number(e.target.value));
      }}
      step="0.01"
      min={0}
      className="h-7 w-20 text-xs bg-zinc-800 border-zinc-600 text-center"
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={`h-7 text-xs bg-zinc-800 border-zinc-600 ${className ?? ''}`}
    />
  );
}

// ── Feature weights editor (default or per-dimension-value) ───────────────────

function WeightsTable({
  values,
  weights,
  onChange,
}: {
  values: string[];
  weights: Record<string, number>;
  onChange: (w: Record<string, number>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {values.map((v) => (
        <div key={v} className="flex items-center gap-2">
          <span className="text-xs text-zinc-300 w-32 truncate">{v}</span>
          <WeightInput
            value={weights[v]}
            onChange={(n) => {
              onChange({ ...weights, [v]: n });
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Pronouns editor ───────────────────────────────────────────────────────────

interface PronounSet {
  subject: string;
  object: string;
  possessive: string;
  reflexive: string;
  noun: string;
}

function PronounsEditor({
  values,
  pronouns,
  onChange,
}: {
  values: string[];
  pronouns: Record<string, PronounSet>;
  onChange: (p: Record<string, PronounSet>) => void;
}) {
  const FIELDS: (keyof PronounSet)[] = [
    'subject',
    'object',
    'possessive',
    'reflexive',
    'noun',
  ];
  return (
    <div className="flex flex-col gap-3">
      {values.map((val) => {
        const set: PronounSet = pronouns[val] ?? {
          subject: '',
          object: '',
          possessive: '',
          reflexive: '',
          noun: '',
        };
        return (
          <div key={val} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-300">{val}</span>
            <div className="grid grid-cols-5 gap-1">
              {FIELDS.map((field) => (
                <div key={field} className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-zinc-500">{field}</span>
                  <TextInput
                    value={set[field]}
                    onChange={(v) => {
                      onChange({ ...pronouns, [val]: { ...set, [field]: v } });
                    }}
                    placeholder={field}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Feature detail editor ─────────────────────────────────────────────────────

function FeatureEditor({
  feature,
  onChange,
}: {
  feature: AppearanceFeatureDefinition;
  onChange: (f: AppearanceFeatureDefinition) => void;
}) {
  const [newValue, setNewValue] = useState('');
  const [newDimId, setNewDimId] = useState('');

  const by = feature.weights.by ?? {};

  function patchWeights(
    update: Partial<AppearanceFeatureDefinition['weights']>,
  ) {
    onChange({ ...feature, weights: { ...feature.weights, ...update } });
  }

  function addValue() {
    const v = newValue.trim();
    if (!v || feature.values.includes(v)) return;
    onChange({ ...feature, values: [...feature.values, v] });
    setNewValue('');
  }

  function removeValue(v: string) {
    const values = feature.values.filter((x) => x !== v);
    // Clean up weights for removed value
    const defaultW = Object.fromEntries(
      Object.entries(feature.weights.default ?? {}).filter(([k]) => k !== v),
    );
    const newBy = Object.fromEntries(
      Object.entries(by).map(([dimId, dimMap]) => [
        dimId,
        Object.fromEntries(
          Object.entries(dimMap).map(([dimVal, w]) => {
            const wCopy = Object.fromEntries(
              Object.entries(w).filter(([k]) => k !== v),
            );
            return [dimVal, wCopy];
          }),
        ),
      ]),
    );
    onChange({
      ...feature,
      values,
      weights: { default: defaultW, by: newBy },
    });
  }

  function addDimensionOverride() {
    const dimId = newDimId.trim();
    if (!dimId || dimId in by) return;
    patchWeights({ by: { ...by, [dimId]: {} } });
    setNewDimId('');
  }

  function removeDimensionOverride(dimId: string) {
    const updated = Object.fromEntries(
      Object.entries(by).filter(([k]) => k !== dimId),
    );
    patchWeights({ by: updated });
  }

  const hasPronounDef = feature.pronouns !== undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Identity */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Feature Identity</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>ID</Label>
            <TextInput
              value={feature.id}
              onChange={(id) => {
                onChange({ ...feature, id });
              }}
              placeholder="featureId"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Label</Label>
            <TextInput
              value={feature.label}
              onChange={(label) => {
                onChange({ ...feature, label });
              }}
              placeholder="Display label"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={feature.isDimension ?? false}
            onChange={(e) => {
              onChange({ ...feature, isDimension: e.target.checked });
            }}
            className="accent-zinc-400"
          />
          Dimension feature (picked first; used to weight other features)
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={hasPronounDef}
            onChange={(e) => {
              onChange({
                ...feature,
                pronouns: e.target.checked ? {} : undefined,
              });
            }}
            className="accent-zinc-400"
          />
          Has pronoun mapping (subject / object / possessive / reflexive / noun)
        </label>
      </div>

      {/* Values */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Values</SectionTitle>
        <div className="flex flex-col gap-1">
          {feature.values.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="flex-1 text-xs text-zinc-300">{v}</span>
              <button
                onClick={() => {
                  removeValue(v);
                }}
                className="text-zinc-500 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <TextInput
            value={newValue}
            onChange={setNewValue}
            placeholder="New value…"
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={addValue}>
            Add
          </Button>
        </div>
      </div>

      {/* Default weights */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Default Weights</SectionTitle>
        <WeightsTable
          values={feature.values}
          weights={feature.weights.default ?? {}}
          onChange={(w) => {
            patchWeights({ default: w });
          }}
        />
      </div>

      {/* Dimension overrides */}
      <div className="flex flex-col gap-2">
        <SectionTitle>Weights by Dimension</SectionTitle>
        {Object.entries(by).map(([dimId, dimMap]) => (
          <div key={dimId} className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-300">
                by <code className="text-zinc-400">{dimId}</code>
              </span>
              <button
                onClick={() => {
                  removeDimensionOverride(dimId);
                }}
                className="text-zinc-500 hover:text-red-400 text-xs ml-auto"
              >
                Remove
              </button>
            </div>
            {Object.keys(dimMap).length === 0 && (
              <p className="text-xs text-zinc-500 italic">
                No dimension values defined yet for &quot;{dimId}&quot;. Add
                them to the dimension feature first.
              </p>
            )}
            {Object.entries(dimMap).map(([dimVal, w]) => (
              <div key={dimVal} className="ml-3 flex flex-col gap-1">
                <span className="text-[11px] text-zinc-400">{dimVal}</span>
                <WeightsTable
                  values={feature.values}
                  weights={w}
                  onChange={(updated) => {
                    patchWeights({
                      by: {
                        ...by,
                        [dimId]: { ...dimMap, [dimVal]: updated },
                      },
                    });
                  }}
                />
              </div>
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <TextInput
            value={newDimId}
            onChange={setNewDimId}
            placeholder="Dimension feature ID…"
            className="flex-1"
          />
          <Button size="sm" variant="outline" onClick={addDimensionOverride}>
            Add override
          </Button>
        </div>
      </div>

      {/* Pronouns */}
      {hasPronounDef && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Pronoun Mapping</SectionTitle>
          <PronounsEditor
            values={feature.values}
            pronouns={(feature.pronouns ?? {}) as Record<string, PronounSet>}
            onChange={(p) => {
              onChange({ ...feature, pronouns: p });
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Age distribution ──────────────────────────────────────────────────────────

function DistInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        className="h-7 text-xs bg-zinc-800 border-zinc-600"
      />
    </div>
  );
}

function AgeDistEditor({
  dist,
  onChange,
}: {
  dist: AppearanceJsonData['ageDistribution'];
  onChange: (d: AppearanceJsonData['ageDistribution']) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {(['min', 'max', 'mean', 'stdDev'] as const).map((k) => (
        <DistInput
          key={k}
          label={k}
          value={dist[k]}
          onChange={(v) => {
            onChange({ ...dist, [k]: v });
          }}
        />
      ))}
    </div>
  );
}

// ── Display config ────────────────────────────────────────────────────────────

function FeatureIdListEditor({
  title,
  description,
  featureIds,
  allFeatures,
  onChange,
}: {
  title: string;
  description: string;
  featureIds: string[];
  allFeatures: AppearanceFeatureDefinition[];
  onChange: (ids: string[]) => void;
}) {
  const available = allFeatures
    .map((f) => f.id)
    .filter((id) => !featureIds.includes(id));

  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>{title}</SectionTitle>
      <p className="text-xs text-zinc-500">{description}</p>
      <div className="flex flex-col gap-1">
        {featureIds.map((id, i) => (
          <div key={id} className="flex items-center gap-2">
            <span className="flex-1 text-xs text-zinc-300 font-mono">{id}</span>
            <button
              onClick={() => {
                if (i > 0)
                  onChange([
                    ...featureIds.slice(0, i - 1),
                    featureIds[i],
                    featureIds[i - 1],
                    ...featureIds.slice(i + 1),
                  ]);
              }}
              disabled={i === 0}
              className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
            >
              ↑
            </button>
            <button
              onClick={() => {
                if (i < featureIds.length - 1)
                  onChange([
                    ...featureIds.slice(0, i),
                    featureIds[i + 1],
                    featureIds[i],
                    ...featureIds.slice(i + 2),
                  ]);
              }}
              disabled={i === featureIds.length - 1}
              className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
            >
              ↓
            </button>
            <button
              onClick={() => {
                onChange(featureIds.filter((x) => x !== id));
              }}
              className="text-zinc-500 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {available.length > 0 && (
        <select
          className="text-xs bg-zinc-800 border border-zinc-600 rounded p-1 text-zinc-300"
          value=""
          onChange={(e) => {
            if (e.target.value) onChange([...featureIds, e.target.value]);
          }}
        >
          <option value="">Add feature…</option>
          {available.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── Body attributes ───────────────────────────────────────────────────────────

const DIST_KEYS = ['min', 'max', 'mean', 'stdDev'] as const;

function NormalDistFields({
  dist,
  onChange,
}: {
  dist: NormalDistParams;
  onChange: (d: NormalDistParams) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DIST_KEYS.map((k) => (
        <DistInput
          key={k}
          label={k}
          value={dist[k]}
          onChange={(v) => {
            onChange({ ...dist, [k]: v });
          }}
        />
      ))}
    </div>
  );
}

function PartialDistFields({
  base,
  partial,
  onChange,
}: {
  base: NormalDistParams;
  partial: Partial<NormalDistParams>;
  onChange: (p: Partial<NormalDistParams>) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {DIST_KEYS.map((k) => (
        <div key={k} className="flex flex-col gap-1">
          <Label>{k}</Label>
          <Input
            type="number"
            placeholder={String(base[k])}
            value={partial[k] ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                const next = Object.fromEntries(
                  Object.entries(partial).filter(([key]) => key !== k),
                );
                onChange(next);
              } else {
                onChange({ ...partial, [k]: Number(raw) });
              }
            }}
            className="h-7 text-xs bg-zinc-800 border-zinc-600"
          />
        </div>
      ))}
    </div>
  );
}

function BodyAttributeRow({
  attr,
  allFeatures,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}: {
  attr: BodyAttributeDefinition;
  allFeatures: AppearanceFeatureDefinition[];
  onChange: (a: BodyAttributeDefinition) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [newDimId, setNewDimId] = useState('');
  const by = attr.distribution.byDimension ?? {};

  function patch(update: Partial<BodyAttributeDefinition>) {
    onChange({ ...attr, ...update });
  }

  function patchDist(update: Partial<BodyAttributeDefinition['distribution']>) {
    onChange({
      ...attr,
      distribution: { ...attr.distribution, ...update },
    });
  }

  function addDimensionOverride() {
    const dimId = newDimId.trim();
    if (!dimId || dimId in by) return;
    patchDist({ byDimension: { ...by, [dimId]: {} } });
    setNewDimId('');
  }

  function removeDimensionOverride(dimId: string) {
    const next = Object.fromEntries(
      Object.entries(by).filter(([k]) => k !== dimId),
    );
    patchDist({ byDimension: next });
  }

  function patchByDim(
    dimId: string,
    dimMap: Record<string, Partial<NormalDistParams>>,
  ) {
    patchDist({ byDimension: { ...by, [dimId]: dimMap } });
  }

  const dimensionFeatures = allFeatures.filter((f) => f.isDimension);
  const showWhen = attr.showWhen;
  const showWhenFeature = showWhen
    ? allFeatures.find((f) => f.id === showWhen.featureId)
    : undefined;

  return (
    <div className="flex flex-col gap-3 border border-zinc-700 rounded p-3 bg-zinc-900/40">
      <div className="flex items-center gap-2">
        <code className="text-xs text-zinc-200 font-mono flex-1">
          {attr.id}
        </code>
        <button
          onClick={() => {
            onMove(-1);
          }}
          disabled={isFirst}
          className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
        >
          ↑
        </button>
        <button
          onClick={() => {
            onMove(1);
          }}
          disabled={isLast}
          className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
        >
          ↓
        </button>
        <button
          onClick={onRemove}
          className="text-zinc-500 hover:text-red-400 text-xs"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col gap-1">
          <Label>ID</Label>
          <TextInput
            value={attr.id}
            onChange={(id) => {
              patch({ id });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Label</Label>
          <TextInput
            value={attr.label}
            onChange={(label) => {
              patch({ label });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Unit</Label>
          <TextInput
            value={attr.unit}
            onChange={(unit) => {
              patch({ unit });
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Default</Label>
          <Input
            type="number"
            value={attr.default}
            onChange={(e) => {
              patch({ default: Number(e.target.value) });
            }}
            className="h-7 text-xs bg-zinc-800 border-zinc-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Default distribution</Label>
        <NormalDistFields
          dist={attr.distribution.default}
          onChange={(d) => {
            patchDist({ default: d });
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Show when</Label>
        <div className="flex items-center gap-2">
          <select
            className="text-xs bg-zinc-800 border border-zinc-600 rounded p-1 text-zinc-300 h-7"
            value={attr.showWhen?.featureId ?? ''}
            onChange={(e) => {
              const featureId = e.target.value;
              if (!featureId) {
                patch({ showWhen: undefined });
                return;
              }
              patch({ showWhen: { featureId, values: [] } });
            }}
          >
            <option value="">Always</option>
            {dimensionFeatures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.id}
              </option>
            ))}
          </select>
          {showWhen && showWhenFeature && (
            <div className="flex flex-wrap gap-1">
              {showWhenFeature.values.map((v) => {
                const checked = showWhen.values.includes(v);
                return (
                  <label
                    key={v}
                    className="flex items-center gap-1 text-xs text-zinc-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? showWhen.values.filter((x) => x !== v)
                          : [...showWhen.values, v];
                        patch({
                          showWhen: { ...showWhen, values: next },
                        });
                      }}
                      className="accent-zinc-400"
                    />
                    {v}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Overrides by dimension</Label>
        <p className="text-[11px] text-zinc-500">
          Sparse — leave a field blank to inherit it from the default.
        </p>
        {Object.entries(by).map(([dimId, dimMap]) => {
          const feature = allFeatures.find((f) => f.id === dimId);
          return (
            <div key={dimId} className="flex flex-col gap-2 ml-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-300">
                  by <code className="text-zinc-400">{dimId}</code>
                </span>
                <button
                  onClick={() => {
                    removeDimensionOverride(dimId);
                  }}
                  className="text-zinc-500 hover:text-red-400 text-xs ml-auto"
                >
                  Remove
                </button>
              </div>
              {feature?.values.map((dimVal) => (
                <div key={dimVal} className="flex flex-col gap-1 ml-3">
                  <span className="text-[11px] text-zinc-400">{dimVal}</span>
                  <PartialDistFields
                    base={attr.distribution.default}
                    partial={dimMap[dimVal] ?? {}}
                    onChange={(p) => {
                      const nextMap =
                        Object.keys(p).length === 0
                          ? Object.fromEntries(
                              Object.entries(dimMap).filter(
                                ([k]) => k !== dimVal,
                              ),
                            )
                          : { ...dimMap, [dimVal]: p };
                      patchByDim(dimId, nextMap);
                    }}
                  />
                </div>
              ))}
              {!feature && (
                <p className="text-[11px] text-zinc-500 italic ml-3">
                  No feature with id &quot;{dimId}&quot; — values cannot be
                  inferred.
                </p>
              )}
            </div>
          );
        })}
        <div className="flex gap-2">
          <select
            className="text-xs bg-zinc-800 border border-zinc-600 rounded p-1 text-zinc-300 h-7 flex-1"
            value={newDimId}
            onChange={(e) => {
              setNewDimId(e.target.value);
            }}
          >
            <option value="">Pick dimension…</option>
            {dimensionFeatures
              .filter((f) => !(f.id in by))
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id}
                </option>
              ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={addDimensionOverride}
            disabled={!newDimId}
          >
            Add override
          </Button>
        </div>
      </div>
    </div>
  );
}

function BodyAttributesEditor({
  attrs,
  allFeatures,
  onChange,
}: {
  attrs: BodyAttributeDefinition[];
  allFeatures: AppearanceFeatureDefinition[];
  onChange: (a: BodyAttributeDefinition[]) => void;
}) {
  function addAttr() {
    const id = `attr_${Date.now().toString()}`;
    onChange([
      ...attrs,
      {
        id,
        label: 'New Attribute',
        unit: '',
        default: 0,
        distribution: { default: { min: 0, max: 100, mean: 50, stdDev: 10 } },
      },
    ]);
  }
  function patchAt(i: number, next: BodyAttributeDefinition) {
    onChange(attrs.map((a, j) => (j === i ? next : a)));
  }
  function removeAt(i: number) {
    onChange(attrs.filter((_, j) => j !== i));
  }
  function moveAt(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= attrs.length) return;
    const next = [...attrs];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Body Attributes</SectionTitle>
      <p className="text-xs text-zinc-500">
        Numeric body measurements sampled into every character. Each appears as
        a template variable (e.g. <code>{'{height}'}</code>) and as an input in
        the player creation UI. Per-dimension overrides inherit any missing
        field from the default.
      </p>
      <div className="flex flex-col gap-3">
        {attrs.map((a, i) => (
          <BodyAttributeRow
            key={a.id}
            attr={a}
            allFeatures={allFeatures}
            onChange={(next) => {
              patchAt(i, next);
            }}
            onRemove={() => {
              removeAt(i);
            }}
            onMove={(delta) => {
              moveAt(i, delta);
            }}
            isFirst={i === 0}
            isLast={i === attrs.length - 1}
          />
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="self-start text-xs"
        onClick={addAttr}
      >
        + Add attribute
      </Button>
    </div>
  );
}

// ── Description templates ─────────────────────────────────────────────────────

function DescriptionEditor({
  sentences,
  onChange,
  context,
}: {
  sentences: string[];
  onChange: (sentences: string[]) => void;
  context: TemplateLintContext;
}) {
  function update(i: number, value: string) {
    onChange(sentences.map((s, j) => (j === i ? value : s)));
  }
  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= sentences.length) return;
    const next = [...sentences];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Description Templates</SectionTitle>
      <p className="text-xs text-zinc-500">
        Sentences rendered in order to form the character&apos;s profile
        description. A sentence is skipped if it references an appearance
        feature with no value.
      </p>
      <div className="rounded border border-zinc-700 bg-zinc-900/50 p-3 text-[11px] leading-relaxed text-zinc-400 flex flex-col gap-1">
        <span className="text-zinc-300 font-semibold">Tokens</span>
        <span>
          <code className="text-zinc-300">{'{age}'}</code> ·{' '}
          <code className="text-zinc-300">{'{noun}'}</code>
          {' / '}
          <code className="text-zinc-300">{'{subject}'}</code>
          {' / '}
          <code className="text-zinc-300">{'{object}'}</code>
          {' / '}
          <code className="text-zinc-300">{'{possessive}'}</code>
          {' / '}
          <code className="text-zinc-300">{'{reflexive}'}</code> ·{' '}
          <code className="text-zinc-300">{'{featureId}'}</code> ·{' '}
          <code className="text-zinc-300">{'{lower:featureId}'}</code> ·{' '}
          <code className="text-zinc-300">{'{a:featureId}'}</code> (a/an +
          lowercased) · <code className="text-zinc-300">{'{@macroName}'}</code>{' '}
          · <code className="text-zinc-300">{'{word:termKey}'}</code> (both
          defined in the Linguistics tab)
        </span>
        <span className="text-zinc-300 font-semibold mt-1">Conditionals</span>
        <span>
          <code className="text-zinc-300">
            {'{if VAR OP VALUE}…{elif …}…{else}…{/if}'}
          </code>{' '}
          — VAR is <code className="text-zinc-300">age</code>,{' '}
          <code className="text-zinc-300">height</code>,{' '}
          <code className="text-zinc-300">weight</code>,{' '}
          <code className="text-zinc-300">bodyFat</code>,{' '}
          <code className="text-zinc-300">bustDifference</code>, a feature id,
          or a global (<code className="text-zinc-300">timeOfDay</code>,{' '}
          <code className="text-zinc-300">weather</code>,{' '}
          <code className="text-zinc-300">totalNearbyNpcs</code>, …); OP is{' '}
          <code className="text-zinc-300">{'>= <= > < == !='}</code>. Bare{' '}
          <code className="text-zinc-300">{'{if featureId}…{/if}'}</code> tests
          presence.
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {sentences.map((sentence, i) => (
          // eslint-disable-next-line react-x/no-array-index-key -- plain string list with no stable id; reorder swaps values in place
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <TemplateEditor
                value={sentence}
                onChange={(v) => {
                  update(i, v);
                }}
                context={context}
              />
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => {
                  move(i, -1);
                }}
                disabled={i === 0}
                className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
              >
                ↑
              </button>
              <button
                onClick={() => {
                  move(i, 1);
                }}
                disabled={i === sentences.length - 1}
                className="text-zinc-500 hover:text-zinc-200 disabled:opacity-30 text-xs"
              >
                ↓
              </button>
              <button
                onClick={() => {
                  onChange(sentences.filter((_, j) => j !== i));
                }}
                className="text-zinc-500 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="self-start text-xs"
        onClick={() => {
          onChange([...sentences, '']);
        }}
      >
        + Add sentence
      </Button>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: 'features', label: 'Features' },
  { id: 'age', label: 'Age Distribution' },
  { id: 'body', label: 'Body Attributes' },
  { id: 'display', label: 'Display Config' },
  { id: 'description', label: 'Description' },
] as const;

type SidebarId = (typeof SIDEBAR_ITEMS)[number]['id'];

export function AppearancePanel() {
  const {
    data: initial,
    saving,
    save,
  } = useEditorData<AppearanceJsonData>('/editor/api/data/appearance');

  const [data, setData] = useState<AppearanceJsonData>(initial);
  const [section, setSection] = useState<SidebarId>('features');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(
    initial.features[0]?.id ?? '',
  );

  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  useReportDirty({
    dirty,
    discard: () => {
      setData(initial);
    },
  });
  useRegisterSave({ save: () => void save(data, 'Appearance saved'), saving });

  function patchFeature(updated: AppearanceFeatureDefinition) {
    setData((prev) => ({
      ...prev,
      features: prev.features.map((f) =>
        f.id === selectedFeatureId ? updated : f,
      ),
    }));
    if (updated.id !== selectedFeatureId) setSelectedFeatureId(updated.id);
  }

  function addFeature() {
    const id = `feature_${Date.now().toString()}`;
    const newFeat: AppearanceFeatureDefinition = {
      id,
      label: 'New Feature',
      values: [],
      weights: {},
    };
    setData((prev) => ({ ...prev, features: [...prev.features, newFeat] }));
    setSelectedFeatureId(id);
  }

  function removeFeature(id: string) {
    setData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f.id !== id),
      display: {
        strangerFeatureIds: prev.display.strangerFeatureIds.filter(
          (x) => x !== id,
        ),
        metaFeatureIds: prev.display.metaFeatureIds.filter((x) => x !== id),
      },
    }));
    setSelectedFeatureId(data.features.find((f) => f.id !== id)?.id ?? '');
  }

  const selectedFeature = data.features.find((f) => f.id === selectedFeatureId);

  function renderMain() {
    switch (section) {
      case 'features':
        return (
          <div className="flex h-full">
            {/* Feature list */}
            <div className="w-40 shrink-0 border-r border-zinc-700 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-zinc-700 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={addFeature}
                >
                  + Add Feature
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {data.features.map((f) => (
                  <div
                    key={f.id}
                    className={`group flex items-center px-2 py-1.5 border-b border-zinc-800 cursor-pointer text-xs transition-colors ${
                      f.id === selectedFeatureId
                        ? 'bg-zinc-700 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                    onClick={() => {
                      setSelectedFeatureId(f.id);
                    }}
                  >
                    <span className="flex-1 truncate">{f.label || f.id}</span>
                    {f.isDimension && (
                      <span className="text-[9px] text-zinc-500 ml-1">D</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFeature(f.id);
                      }}
                      className="hidden group-hover:block text-zinc-500 hover:text-red-400 ml-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature detail */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedFeature ? (
                <FeatureEditor
                  feature={selectedFeature}
                  onChange={patchFeature}
                />
              ) : (
                <p className="text-xs text-zinc-500">
                  Select or add a feature.
                </p>
              )}
            </div>
          </div>
        );

      case 'age':
        return (
          <div className="p-4">
            <SectionTitle>Age Distribution</SectionTitle>
            <AgeDistEditor
              dist={data.ageDistribution}
              onChange={(d) => {
                setData((prev) => ({ ...prev, ageDistribution: d }));
              }}
            />
          </div>
        );

      case 'body':
        return (
          <div className="p-4 overflow-y-auto h-full">
            <BodyAttributesEditor
              attrs={data.bodyAttributes}
              allFeatures={data.features}
              onChange={(attrs) => {
                setData((prev) => ({ ...prev, bodyAttributes: attrs }));
              }}
            />
          </div>
        );

      case 'display':
        return (
          <div className="p-4 flex flex-col gap-6">
            <FeatureIdListEditor
              title="Stranger Description Features"
              description="Feature values listed when describing an unknown NPC. The gender noun from the pronoun feature is appended automatically."
              featureIds={data.display.strangerFeatureIds}
              allFeatures={data.features}
              onChange={(ids) => {
                setData((prev) => ({
                  ...prev,
                  display: { ...prev.display, strangerFeatureIds: ids },
                }));
              }}
            />
            <FeatureIdListEditor
              title="Meta Line Features"
              description="Feature values shown in the NPC meta line (between profession and pronouns)."
              featureIds={data.display.metaFeatureIds}
              allFeatures={data.features}
              onChange={(ids) => {
                setData((prev) => ({
                  ...prev,
                  display: { ...prev.display, metaFeatureIds: ids },
                }));
              }}
            />
          </div>
        );

      case 'description': {
        const descriptionContext: TemplateLintContext = {
          variables: [
            ...baseTemplateVariableNames(),
            ...data.features.map((f) => f.id),
          ],
          macros: [...getMacros().entries()].map(([name, { params }]) => ({
            name,
            params,
          })),
          terms: [...getTerms().keys()],
        };
        return (
          <div className="p-4 overflow-y-auto h-full">
            <DescriptionEditor
              sentences={data.description?.sentences ?? []}
              context={descriptionContext}
              onChange={(sentences) => {
                setData((prev) => ({ ...prev, description: { sentences } }));
              }}
            />
          </div>
        );
      }
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-zinc-700 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-zinc-700 shrink-0">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Appearance
          </p>
        </div>
        <div className="overflow-y-auto flex-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSection(item.id);
              }}
              className={`w-full text-left px-3 py-2 border-b border-zinc-800 text-xs transition-colors ${
                section === item.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {section !== 'features' && (
          <div className="px-4 py-3 border-b border-zinc-700 shrink-0">
            <h2 className="text-sm font-semibold text-white">
              {SIDEBAR_ITEMS.find((s) => s.id === section)?.label}
            </h2>
          </div>
        )}
        <div
          className={`flex-1 overflow-hidden ${section === 'features' ? '' : ''}`}
        >
          {renderMain()}
        </div>
      </div>
    </div>
  );
}

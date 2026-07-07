import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { Input } from '@chemicalluck/engine/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';
import { getAppearanceLists } from '@chemicalluck/engine/features/npcs/lib/appearance-config';
import { getProfessions } from '@chemicalluck/engine/features/npcs/lib/professions';
import type { NpcFilter } from '@chemicalluck/engine/types/npc-filter.types';

const TRAITS = ['Introverted', 'Extroverted'] as const;

function defaultFilter(): NpcFilter {
  const features = getAppearanceLists();
  return features.length > 0
    ? {
        kind: 'appearance',
        featureId: features[0].id,
        value: features[0].values[0] ?? '',
      }
    : { kind: 'profession', profession: getProfessions()[0] ?? '' };
}

export function NpcFiltersEditor({
  filters,
  onChange,
}: {
  filters: NpcFilter[][];
  onChange: (f: NpcFilter[][]) => void;
}) {
  const features = getAppearanceLists();
  const professions = getProfessions();

  function addGroup() {
    onChange([...filters, [defaultFilter()]]);
  }

  function removeGroup(gi: number) {
    onChange(filters.filter((_, i) => i !== gi));
  }

  function addFilter(gi: number) {
    onChange(filters.map((g, i) => (i === gi ? [...g, defaultFilter()] : g)));
  }

  function removeFilter(gi: number, fi: number) {
    const next = filters.map((g, i) =>
      i === gi ? g.filter((_, j) => j !== fi) : g,
    );
    onChange(next.filter((g) => g.length > 0));
  }

  function setFilter(gi: number, fi: number, f: NpcFilter) {
    onChange(
      filters.map((g, i) =>
        i === gi ? g.map((flt, j) => (j === fi ? f : flt)) : g,
      ),
    );
  }

  return (
    <div className="space-y-2">
      {filters.map((group, gi) => (
        // eslint-disable-next-line react-x/no-array-index-key
        <div key={gi} className="border border-zinc-700 rounded p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Group {gi + 1} (AND)</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-zinc-600 hover:text-red-400"
              onClick={() => {
                removeGroup(gi);
              }}
            >
              <Trash2 size={10} />
            </Button>
          </div>
          {group.map((f, fi) => (
            // eslint-disable-next-line react-x/no-array-index-key
            <div key={fi} className="flex items-center gap-1">
              <Select
                value={f.kind}
                onValueChange={(k) => {
                  const kk = k as NpcFilter['kind'];
                  setFilter(
                    gi,
                    fi,
                    kk === 'appearance'
                      ? defaultFilter()
                      : kk === 'profession'
                        ? {
                            kind: 'profession',
                            profession: getProfessions()[0] ?? '',
                          }
                        : { kind: 'trait', trait: 'Extroverted' },
                  );
                }}
              >
                <SelectTrigger size="sm" className="h-6 text-xs w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appearance">appearance</SelectItem>
                  <SelectItem value="profession">profession</SelectItem>
                  <SelectItem value="trait">trait</SelectItem>
                </SelectContent>
              </Select>

              {f.kind === 'appearance' && (
                <>
                  <Select
                    value={f.featureId}
                    onValueChange={(featureId) => {
                      const feat = features.find((x) => x.id === featureId);
                      setFilter(gi, fi, {
                        kind: 'appearance',
                        featureId,
                        value: feat?.values[0] ?? '',
                      });
                    }}
                  >
                    <SelectTrigger size="sm" className="h-6 text-xs w-28">
                      <SelectValue placeholder="Feature…" />
                    </SelectTrigger>
                    <SelectContent>
                      {features.map((feat) => (
                        <SelectItem key={feat.id} value={feat.id}>
                          {feat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {features.find((x) => x.id === f.featureId)?.values.length ? (
                    <Select
                      value={f.value}
                      onValueChange={(value) => {
                        setFilter(gi, fi, { ...f, value });
                      }}
                    >
                      <SelectTrigger size="sm" className="h-6 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {features
                          .find((x) => x.id === f.featureId)
                          ?.values.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={f.value}
                      onChange={(e) => {
                        setFilter(gi, fi, { ...f, value: e.target.value });
                      }}
                      className="h-6 text-xs flex-1"
                      placeholder="value…"
                    />
                  )}
                </>
              )}

              {f.kind === 'profession' && (
                <Select
                  value={f.profession}
                  onValueChange={(v) => {
                    setFilter(gi, fi, { kind: 'profession', profession: v });
                  }}
                >
                  <SelectTrigger size="sm" className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {professions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {f.kind === 'trait' && (
                <Select
                  value={f.trait}
                  onValueChange={(v) => {
                    setFilter(gi, fi, {
                      kind: 'trait',
                      trait: v as (typeof TRAITS)[number],
                    });
                  }}
                >
                  <SelectTrigger size="sm" className="h-6 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAITS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
                onClick={() => {
                  removeFilter(gi, fi);
                }}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs px-1 text-zinc-600 hover:text-zinc-300"
            onClick={() => {
              addFilter(gi);
            }}
          >
            <Plus size={10} /> filter
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
        onClick={addGroup}
      >
        <Plus size={10} /> group
      </Button>
    </div>
  );
}

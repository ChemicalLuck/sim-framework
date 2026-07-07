import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import { Field } from '@sim/engine/components/ui/field';
import { Input } from '@sim/engine/components/ui/input';
import { Label } from '@sim/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import type { NpcFilter, NpcSelection } from '@sim/engine/types/npc-filter.types';

import { NpcFiltersEditor } from './npc-filters-editor';

type SelectionMode = 'none' | 'ids' | 'filter';

function modeOf(selection: NpcSelection | undefined): SelectionMode {
  if (!selection) return 'none';
  return 'npcIds' in selection ? 'ids' : 'filter';
}

export function NpcSelectionEditor({
  selection,
  onChange,
}: {
  selection: NpcSelection | undefined;
  onChange: (s: NpcSelection | undefined) => void;
}) {
  const mode = modeOf(selection);
  const [localIds, setLocalIds] = useState<string[]>(
    selection && 'npcIds' in selection ? selection.npcIds : [''],
  );

  function switchMode(next: SelectionMode) {
    if (next === 'none') {
      onChange(undefined);
    } else if (next === 'ids') {
      const ids = localIds.filter(Boolean);
      onChange(ids.length ? { npcIds: ids } : { npcIds: [''] });
    } else {
      onChange({ npcCount: 1 });
    }
  }

  function updateIds(ids: string[]) {
    setLocalIds(ids);
    const filtered = ids.filter(Boolean);
    if (filtered.length) onChange({ npcIds: filtered });
  }

  const ids = selection && 'npcIds' in selection ? selection.npcIds : localIds;
  const count = selection && 'npcCount' in selection ? selection.npcCount : 1;
  const filters: NpcFilter[][] =
    selection && 'npcCount' in selection ? (selection.npcFilters ?? []) : [];

  return (
    <div className="space-y-2">
      <Field>
        <Label>NPC selection</Label>
        <Select
          value={mode}
          onValueChange={(v) => {
            switchMode(v as SelectionMode);
          }}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="ids">Explicit IDs</SelectItem>
            <SelectItem value="filter">Filter from nearby</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {mode === 'ids' && (
        <div className="space-y-1">
          {ids.map((id, i) => (
            // eslint-disable-next-line react-x/no-array-index-key
            <div key={i} className="flex items-center gap-1">
              <Input
                value={id}
                onChange={(e) => {
                  const next = ids.map((v, j) =>
                    j === i ? e.target.value : v,
                  );
                  updateIds(next);
                }}
                className="h-7 text-xs flex-1 font-mono"
                placeholder="npc_id or {npc0.id}"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 shrink-0"
                onClick={() => {
                  updateIds(ids.filter((_, j) => j !== i));
                }}
              >
                <X size={10} />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-xs text-zinc-500 hover:text-zinc-300"
            onClick={() => {
              updateIds([...ids, '']);
            }}
          >
            <Plus size={10} /> add ID
          </Button>
        </div>
      )}

      {mode === 'filter' && (
        <div className="space-y-2">
          <Field>
            <Label>Count</Label>
            <Input
              type="number"
              min="1"
              value={count}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onChange({
                  npcCount: !isNaN(val) && val > 0 ? val : 1,
                  npcFilters: filters.length ? filters : undefined,
                });
              }}
              className="h-7 text-xs w-20"
            />
          </Field>
          <Label>Filters (OR between groups)</Label>
          <NpcFiltersEditor
            filters={filters}
            onChange={(f) => {
              onChange({
                npcCount: count,
                npcFilters: f.length ? f : undefined,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}

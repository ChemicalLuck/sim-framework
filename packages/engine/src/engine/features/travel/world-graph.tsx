import * as dagre from '@dagrejs/dagre';
import {
  Background,
  Controls,
  type EdgeMouseHandler,
  type Edge as FlowEdge,
  type Node as FlowNode,
  MiniMap,
  type NodeMouseHandler,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@chemicalluck/sim-engine/components/ui/badge';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Input } from '@chemicalluck/sim-engine/components/ui/input';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import { ActionGroupsEditor } from '@chemicalluck/sim-engine/editor/components/action-groups-editor';
import { useRegisterSave } from '@chemicalluck/sim-engine/editor/lib/save-context';
import { useAvailableData } from '@chemicalluck/sim-engine/editor/lib/use-available-data';
import { useEditorData } from '@chemicalluck/sim-engine/editor/lib/use-editor-data';
import {
  formatMoney,
  getCurrencySymbol,
} from '@chemicalluck/sim-engine/features/money/lib/currency';
import type {
  Edge,
  LocationNode,
  LocationType,
  TravelType,
} from '@chemicalluck/sim-engine/features/travel/types';

interface WorldData {
  locations: LocationNode[];
  edges: Edge[];
}

// ── Layout ───────────────────────────────────────────────────────

const NODE_W = 160;
const NODE_H = 44;

function buildDagreLayout(
  locations: LocationNode[],
  edges: Edge[],
): Record<string, { x: number; y: number }> {
  const locSet = new Set(locations.map((l) => l.id));

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 80,
    marginx: 30,
    marginy: 30,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const loc of locations) {
    g.setNode(loc.id, { width: NODE_W, height: NODE_H });
  }

  for (const loc of locations) {
    if (loc.parent && locSet.has(loc.parent)) {
      g.setEdge(loc.parent, loc.id);
    }
  }

  const seen = new Set<string>();
  for (const edge of edges) {
    const [a, b] = edge.nodes;
    if (!locSet.has(a) || !locSet.has(b)) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (!seen.has(key)) {
      seen.add(key);
      if (!g.hasEdge(a, b) && !g.hasEdge(b, a)) {
        g.setEdge(a, b);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  dagre.layout(g);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const loc of locations) {
    const node = g.node(loc.id) as { x: number; y: number } | undefined;
    if (node) {
      positions[loc.id] = {
        x: Math.round(node.x - NODE_W / 2),
        y: Math.round(node.y - NODE_H / 2),
      };
    }
  }
  return positions;
}

// ── Edge builders ────────────────────────────────────────────────

function buildTravelFlowEdge(
  edge: Edge,
  idx: number,
  selected: boolean,
): FlowEdge {
  const styles: Record<
    string,
    { strokeDasharray?: string; stroke: string; strokeWidth: number }
  > = {
    walk: { stroke: '#22c55e', strokeWidth: 2 },
    bus: { strokeDasharray: '6 3', stroke: '#f59e0b', strokeWidth: 2 },
    train: { strokeDasharray: '2 4', stroke: '#8b5cf6', strokeWidth: 2 },
    drive: { stroke: '#ef4444', strokeWidth: 2 },
  };
  const base = styles[edge.kind] ?? { stroke: '#6b7280', strokeWidth: 2 };
  const style = selected
    ? { ...base, strokeWidth: 3, filter: 'drop-shadow(0 0 4px currentColor)' }
    : base;
  const label =
    edge.cost != null
      ? `${edge.kind} (${formatMoney(edge.cost)})`
      : `${edge.kind} ${String(edge.weight)}min`;

  return {
    id: `travel-${String(idx)}`,
    source: edge.nodes[0],
    target: edge.nodes[1],
    label,
    style,
    animated: edge.kind === 'train',
    zIndex: 2,
  };
}

function buildParentFlowEdges(locations: LocationNode[]): FlowEdge[] {
  return locations
    .filter(
      (loc): loc is LocationNode & { parent: string } => loc.parent != null,
    )
    .map((loc) => ({
      id: `parent-${loc.id}`,
      source: loc.parent,
      target: loc.id,
      style: { stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 3' },
      zIndex: 1,
    }));
}

// ── Detail panel ─────────────────────────────────────────────────

function DetailPanel({
  location,
  onClose,
  onUpdate,
}: {
  location: LocationNode | null;
  onClose: () => void;
  onUpdate: (loc: LocationNode) => void;
}) {
  const availableData = useAvailableData();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');

  if (!location) return null;

  const loc = location;

  function startEditName() {
    setNameInput(loc.name);
    setEditingName(true);
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed) onUpdate({ ...loc, name: trimmed });
    setEditingName(false);
  }

  function startEditDesc() {
    setDescInput(loc.description ?? '');
    setEditingDesc(true);
  }

  function saveDesc() {
    const trimmed = descInput.trim();
    onUpdate({ ...loc, description: trimmed || undefined });
    setEditingDesc(false);
  }

  return (
    <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto border-l border-zinc-700 bg-zinc-900 p-4 z-10">
      <div className="flex items-center justify-between mb-4">
        {editingName ? (
          <div className="flex-1 flex items-center gap-1 mr-1">
            <Input
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName();
                if (e.key === 'Escape') setEditingName(false);
              }}
              className="h-6 text-sm bg-zinc-800 border-zinc-600 flex-1"
              autoFocus
            />
            <button
              onClick={saveName}
              className="text-xs text-zinc-400 hover:text-white px-1"
            >
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={startEditName}
            className="font-semibold text-white truncate hover:text-zinc-300 text-left"
            title="Click to edit name"
          >
            {location.name}
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white shrink-0"
        >
          <X size={12} />
        </Button>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-zinc-400">ID: </span>
          <code className="text-zinc-300 text-xs bg-zinc-800 px-1 rounded">
            {location.id}
          </code>
        </div>
        <div>
          <span className="text-zinc-400">Kind: </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              location.kind === 'exterior'
                ? 'bg-blue-900 text-blue-300'
                : 'bg-zinc-700 text-zinc-300'
            }`}
          >
            {location.kind}
          </span>
        </div>
        {location.parent && (
          <div>
            <span className="text-zinc-400">Parent: </span>
            <code className="text-zinc-300 text-xs bg-zinc-800 px-1 rounded">
              {location.parent}
            </code>
          </div>
        )}

        {/* Description — editable */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-zinc-400 text-xs">Description</span>
            {!editingDesc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditDesc}
                className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {location.description ? (
                  <Pencil size={12} />
                ) : (
                  <>
                    <Plus size={12} /> add
                  </>
                )}
              </Button>
            )}
          </div>
          {editingDesc ? (
            <div className="space-y-1">
              <textarea
                value={descInput}
                onChange={(e) => {
                  setDescInput(e.target.value);
                }}
                rows={3}
                className="w-full text-xs bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-500"
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={saveDesc}
                  className="h-6 text-xs px-3"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingDesc(false);
                  }}
                  className="h-6 text-xs px-3 border-zinc-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : location.description ? (
            <p className="text-zinc-300 text-xs leading-relaxed">
              {location.description}
            </p>
          ) : (
            <p className="text-zinc-600 text-xs italic">No description</p>
          )}
        </div>

        {location.nearby && (
          <div>
            <p className="text-zinc-400 mb-1">Nearby:</p>
            <pre className="text-xs text-zinc-300 bg-zinc-800 p-2 rounded overflow-x-auto">
              {JSON.stringify(location.nearby, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <ActionGroupsEditor
          groups={loc.actions ?? []}
          onChange={(groups) => {
            onUpdate({ ...loc, actions: groups.length ? groups : undefined });
          }}
          availableData={availableData}
        />
      </div>
    </div>
  );
}

// ── Add Location form ────────────────────────────────────────────

function AddLocationForm({
  locationIds,
  onAdd,
  onCancel,
}: {
  locationIds: string[];
  onAdd: (loc: LocationNode) => void;
  onCancel: () => void;
}) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [kind, setKind] = useState<LocationType>('interior');
  const [parent, setParent] = useState('');
  const [description, setDescription] = useState('');

  function submit() {
    const trimId = id.trim();
    const trimName = name.trim();
    if (!trimId || !trimName) return;
    onAdd({
      id: trimId,
      name: trimName,
      kind,
      parent: parent.trim() || undefined,
      description: description.trim() || undefined,
    });
  }

  return (
    <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto border-l border-zinc-700 bg-zinc-900 p-4 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">New Location</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
        >
          <X size={12} />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">ID</Label>
          <Input
            value={id}
            onChange={(e) => {
              setId(e.target.value);
            }}
            placeholder="halls_room_a1"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Room A1"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Kind</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as LocationType);
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full bg-zinc-800 border-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interior">interior</SelectItem>
              <SelectItem value="exterior">exterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Parent (optional)</Label>
          <Input
            value={parent}
            onChange={(e) => {
              setParent(e.target.value);
            }}
            placeholder="halls"
            list="add-loc-ids"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
          <datalist id="add-loc-ids">
            {locationIds.map((lid) => (
              <option key={lid} value={lid} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">
            Description (optional)
          </Label>
          <Input
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <Button
          size="sm"
          onClick={submit}
          disabled={!id.trim() || !name.trim()}
          className="w-full h-8"
        >
          Add Location
        </Button>
      </div>
    </div>
  );
}

// ── Add Edge form ─────────────────────────────────────────────────

function AddEdgeForm({
  locationIds,
  onAdd,
  onCancel,
}: {
  locationIds: string[];
  onAdd: (edge: Edge) => void;
  onCancel: () => void;
}) {
  const [source, setSource] = useState(locationIds[0] ?? '');
  const [target, setTarget] = useState(locationIds[1] ?? '');
  const [kind, setKind] = useState<TravelType>('walk');
  const [weight, setWeight] = useState('5');
  const [cost, setCost] = useState('');

  function submit() {
    if (!source || !target || source === target) return;
    onAdd({
      nodes: [source, target],
      kind,
      weight: parseFloat(weight) || 5,
      cost: cost !== '' ? parseFloat(cost) : undefined,
    });
  }

  return (
    <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto border-l border-zinc-700 bg-zinc-900 p-4 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">New Edge</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
        >
          <X size={12} />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">From</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger
              size="sm"
              className="w-full bg-zinc-800 border-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locationIds.map((lid) => (
                <SelectItem key={lid} value={lid}>
                  {lid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">To</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger
              size="sm"
              className="w-full bg-zinc-800 border-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locationIds.map((lid) => (
                <SelectItem key={lid} value={lid}>
                  {lid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Type</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as TravelType);
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full bg-zinc-800 border-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['walk', 'bus', 'train', 'drive'] as TravelType[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Duration (minutes)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
            }}
            min="1"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">
            Cost {getCurrencySymbol()} (optional)
          </Label>
          <Input
            type="number"
            value={cost}
            onChange={(e) => {
              setCost(e.target.value);
            }}
            step="0.10"
            min="0"
            placeholder="0.00"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <Button
          size="sm"
          onClick={submit}
          disabled={!source || !target || source === target}
          className="w-full h-8"
        >
          Add Edge
        </Button>
      </div>
    </div>
  );
}

// ── Edit Edge panel ───────────────────────────────────────────────

function EditEdgePanel({
  edge,
  idx,
  locations,
  onUpdate,
  onDelete,
  onClose,
}: {
  edge: Edge;
  idx: number;
  locations: LocationNode[];
  onUpdate: (idx: number, edge: Edge) => void;
  onDelete: (idx: number) => void;
  onClose: () => void;
}) {
  const availableData = useAvailableData();
  const availableEventIds =
    (availableData.events as string[] | undefined) ?? [];
  const locMap = Object.fromEntries(locations.map((l) => [l.id, l.name]));
  const [kind, setKind] = useState<TravelType>(edge.kind);
  const [weight, setWeight] = useState(String(edge.weight));
  const [cost, setCost] = useState(edge.cost != null ? String(edge.cost) : '');
  const [eventIds, setEventIds] = useState<string[]>(edge.eventIds ?? []);

  function save() {
    onUpdate(idx, {
      ...edge,
      kind,
      weight: parseFloat(weight) || edge.weight,
      cost: cost !== '' ? parseFloat(cost) : undefined,
      eventIds: eventIds.length ? eventIds : undefined,
    });
  }

  return (
    <div className="absolute right-0 top-0 h-full w-72 overflow-y-auto border-l border-zinc-700 bg-zinc-900 p-4 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Edit Edge</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
        >
          <X size={12} />
        </Button>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">From</span>
          <p className="text-sm text-zinc-200">
            {locMap[edge.nodes[0]] ?? edge.nodes[0]}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-zinc-400">To</span>
          <p className="text-sm text-zinc-200">
            {locMap[edge.nodes[1]] ?? edge.nodes[1]}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Type</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as TravelType);
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-full bg-zinc-800 border-zinc-600"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['walk', 'bus', 'train', 'drive'] as TravelType[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Duration (minutes)</Label>
          <Input
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
            }}
            min="1"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">
            Cost {getCurrencySymbol()} (optional)
          </Label>
          <Input
            type="number"
            value={cost}
            onChange={(e) => {
              setCost(e.target.value);
            }}
            step="0.10"
            min="0"
            placeholder="0.00"
            className="h-8 text-sm bg-zinc-800 border-zinc-600"
          />
        </div>
        {availableEventIds.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Events</Label>
            <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
              {eventIds.map((id) => (
                <Badge
                  key={id}
                  className="bg-violet-950/60 text-violet-300 border border-violet-800/50 font-mono text-xs gap-1"
                >
                  {id}
                  <button
                    onClick={() => {
                      setEventIds(eventIds.filter((e) => e !== id));
                    }}
                    className="opacity-50 hover:opacity-100 leading-none"
                    title="Remove event"
                  >
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              {availableEventIds.filter((id) => !eventIds.includes(id)).length >
                0 && (
                <Select
                  key={eventIds.join(',')}
                  onValueChange={(v) => {
                    setEventIds([...eventIds, v]);
                  }}
                >
                  <SelectTrigger className="h-8 w-auto gap-1.5 px-3 border-0 bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground text-sm font-medium [&>svg:last-child]:hidden">
                    <Plus size={12} /> event
                  </SelectTrigger>
                  <SelectContent>
                    {availableEventIds
                      .filter((id) => !eventIds.includes(id))
                      .map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} className="flex-1 h-8">
            Save
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              onDelete(idx);
            }}
            className="h-8 px-3"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-10 left-2 z-10 bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-xs space-y-1.5 pointer-events-none">
      <p className="text-zinc-400 font-medium mb-1">Edge types</p>
      {[
        { color: '#22c55e', label: 'Walk', dash: false },
        { color: '#f59e0b', label: 'Bus', dash: true },
        { color: '#8b5cf6', label: 'Train', dash: true },
        { color: '#ef4444', label: 'Drive', dash: false },
        { color: '#3f3f46', label: 'Contains', dash: true },
      ].map(({ color, label, dash }) => (
        <div key={label} className="flex items-center gap-2">
          <svg width="24" height="8">
            <line
              x1="0"
              y1="4"
              x2="24"
              y2="4"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dash ? '4 3' : undefined}
            />
          </svg>
          <span style={{ color }} className="opacity-90">
            {label}
          </span>
        </div>
      ))}
      <div className="border-t border-zinc-700 pt-1.5 space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-amber-600 border border-amber-400" />
          <span className="text-zinc-400">Start location</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-blue-600" />
          <span className="text-zinc-400">Exterior</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm inline-block bg-zinc-600" />
          <span className="text-zinc-400">Interior</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export function WorldGraph() {
  const { data: locsData, save: saveLocs } = useEditorData<LocationNode[]>(
    '/editor/api/data/locations',
  );
  const { data: edgesData, save: saveEdges } = useEditorData<Edge[]>(
    '/editor/api/data/edges',
  );
  const { data: cfgData } = useEditorData<{ startLocation?: string }>(
    '/editor/api/data/player',
  );

  const [data, setData] = useState<WorldData>(() => ({
    locations: locsData,
    edges: edgesData,
  }));
  const startLocation = cfgData.startLocation ?? 'bedroom';
  const [selected, setSelected] = useState<LocationNode | null>(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<'location' | 'edge' | null>(null);
  const [saving, setSaving] = useState(false);
  useRegisterSave({ save: () => void handleSave(), saving });

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      saveLocs(data.locations, ''),
      saveEdges(data.edges, ''),
    ]);
    toast.success('World saved');
    setSaving(false);
  }

  function addLocation(loc: LocationNode) {
    setData((d) => ({ ...d, locations: [...d.locations, loc] }));
    setMode(null);
    setSelected(loc);
    setSelectedEdgeIdx(null);
  }

  function addEdge(edge: Edge) {
    setData((d) => ({ ...d, edges: [...d.edges, edge] }));
    setMode(null);
  }

  function updateEdge(idx: number, updated: Edge) {
    setData((d) => ({
      ...d,
      edges: d.edges.map((e, i) => (i === idx ? updated : e)),
    }));
  }

  function deleteEdge(idx: number) {
    setData((d) => ({ ...d, edges: d.edges.filter((_, i) => i !== idx) }));
    setSelectedEdgeIdx(null);
  }

  function updateLocation(updated: LocationNode) {
    setData((d) => ({
      ...d,
      locations: d.locations.map((l) => (l.id === updated.id ? updated : l)),
    }));
    setSelected(updated);
  }

  const positions = buildDagreLayout(data.locations, data.edges);

  const nodes: FlowNode[] = data.locations.map((loc) => {
    const pos = positions[loc.id] ?? { x: 0, y: 0 };
    const isStart = loc.id === startLocation;
    const isExterior = loc.kind === 'exterior';
    const isHub = !loc.parent;

    let bg = '#52525b';
    if (isStart) bg = '#b45309';
    else if (isExterior) bg = '#1d4ed8';

    return {
      id: loc.id,
      position: pos,
      data: { label: loc.name, location: loc },
      style: {
        background: bg,
        color: '#fff',
        border: isStart
          ? '2px solid #fbbf24'
          : selected?.id === loc.id
            ? '2px solid #fff'
            : '1px solid rgba(255,255,255,0.15)',
        borderRadius: isStart ? 8 : 6,
        fontSize: isStart ? 12 : 11,
        padding: '4px 10px',
        width: NODE_W,
        height: NODE_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: isStart ? 700 : isHub ? 600 : 400,
        boxShadow: isStart ? '0 0 12px rgba(251,191,36,0.4)' : undefined,
        boxSizing: 'border-box',
      },
    };
  });

  const parentEdges = buildParentFlowEdges(data.locations);
  const travelEdges = data.edges.map((e, i) =>
    buildTravelFlowEdge(e, i, i === selectedEdgeIdx),
  );
  const flowEdges: FlowEdge[] = [...parentEdges, ...travelEdges];

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const loc = (node.data as { location: LocationNode }).location;
    setMode(null);
    setSelectedEdgeIdx(null);
    setSelected((prev) => (prev?.id === loc.id ? null : loc));
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_event, edge) => {
    if (!edge.id.startsWith('travel-')) return;
    const idx = parseInt(edge.id.replace('travel-', ''), 10);
    if (isNaN(idx)) return;
    setMode(null);
    setSelected(null);
    setSelectedEdgeIdx((prev) => (prev === idx ? null : idx));
  }, []);

  const locationIds = data.locations.map((l) => l.id);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700 shrink-0 bg-zinc-900">
        <Button
          size="sm"
          variant={mode === 'location' ? 'default' : 'outline'}
          onClick={() => {
            setMode(mode === 'location' ? null : 'location');
          }}
          className="h-7 text-xs border-zinc-600"
        >
          <Plus size={12} /> Location
        </Button>
        <Button
          size="sm"
          variant={mode === 'edge' ? 'default' : 'outline'}
          onClick={() => {
            setMode(mode === 'edge' ? null : 'edge');
          }}
          className="h-7 text-xs border-zinc-600"
        >
          <Plus size={12} /> Edge
        </Button>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {data.locations.length} nodes · {data.edges.length} edges
          </span>
        </span>
      </div>

      {/* Graph + overlays */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          colorMode="dark"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              const style = n.style as { background?: string } | undefined;
              return style?.background ?? '#52525b';
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
        </ReactFlow>

        <Legend />

        {mode === 'location' && (
          <AddLocationForm
            locationIds={locationIds}
            onAdd={addLocation}
            onCancel={() => {
              setMode(null);
            }}
          />
        )}
        {mode === 'edge' && (
          <AddEdgeForm
            locationIds={locationIds}
            onAdd={addEdge}
            onCancel={() => {
              setMode(null);
            }}
          />
        )}
        {mode === null && selectedEdgeIdx !== null && (
          <EditEdgePanel
            edge={data.edges[selectedEdgeIdx]}
            idx={selectedEdgeIdx}
            locations={data.locations}
            onUpdate={updateEdge}
            onDelete={deleteEdge}
            onClose={() => {
              setSelectedEdgeIdx(null);
            }}
          />
        )}
        {mode === null && selectedEdgeIdx === null && (
          <DetailPanel
            location={selected}
            onClose={() => {
              setSelected(null);
            }}
            onUpdate={updateLocation}
          />
        )}
      </div>
    </div>
  );
}

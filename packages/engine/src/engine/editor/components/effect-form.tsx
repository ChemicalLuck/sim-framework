import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@chemicalluck/engine/components/ui/badge';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { Field, FieldGroup } from '@chemicalluck/engine/components/ui/field';
import { Label } from '@chemicalluck/engine/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/engine/components/ui/select';
import {
  type EffectEditorModule,
  useEffectEditors,
} from '@chemicalluck/engine/editor/lib/effect-editor';
import { type AvailableData } from '@chemicalluck/engine/editor/lib/use-available-data';
import type { Effect } from '@chemicalluck/engine/types/effect.types';

export function EffectChip({
  effect,
  onRemove,
  onClick,
}: {
  effect: Effect;
  onRemove?: () => void;
  onClick?: () => void;
}) {
  const editors = useEffectEditors() as Record<
    string,
    EffectEditorModule | undefined
  >;
  const editor = editors[effect.kind];
  const color = editor?.color ?? 'bg-zinc-700 text-zinc-300';
  const label = editor ? editor.label(effect) : 'fx';
  const interactive = onClick
    ? 'cursor-pointer hover:ring-1 hover:ring-zinc-400'
    : '';
  return (
    <Badge
      onClick={onClick}
      title={onClick ? 'Click to edit' : undefined}
      className={`${color} ${interactive}`}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-50 hover:opacity-100 leading-none pl-0.5"
          title="Remove effect"
        >
          <X size={10} />
        </button>
      )}
    </Badge>
  );
}

export function AddEffectForm({
  onAdd,
  onCancel,
  initial,
  availableData,
}: {
  onAdd: (effect: Effect) => void;
  onCancel: () => void;
  initial?: Effect;
  availableData?: AvailableData;
}) {
  const editors = useEffectEditors() as Record<
    string,
    EffectEditorModule | undefined
  >;

  const editableKinds = useMemo(
    () =>
      Object.keys(editors)
        .filter((k) => !editors[k]?.hidden)
        .sort(),
    [editors],
  );

  const initialKind =
    initial && editors[initial.kind] ? initial.kind : (editableKinds[0] ?? '');

  const [kind, setKind] = useState<string>(initialKind);
  const [state, setState] = useState<unknown>(() => {
    const mod = editors[initialKind];
    if (!mod) return {};
    return initial ? mod.toFormState(initial) : mod.defaultState;
  });

  useEffect(() => {
    if (initial == null) return;
    const mod = editors[initial.kind];
    if (!mod) return;
    setKind(initial.kind);
    setState(mod.toFormState(initial));
  }, [initial, editors]);

  if (editableKinds.length === 0) return null;
  const mod = editors[kind];
  if (!mod) return null;

  const activeMod = mod;
  const effect = activeMod.buildEffect(state);
  const isEditing = initial != null;
  const Fields = activeMod.Fields;

  function submit() {
    if (!effect) return;
    onAdd(effect);
    if (!isEditing) {
      setState(activeMod.defaultState);
    }
  }

  function changeKind(next: string) {
    const nextMod = editors[next];
    if (!nextMod) return;
    setKind(next);
    setState(nextMod.defaultState);
  }

  return (
    <FieldGroup>
      <div className="flex items-end gap-2">
        <Field>
          <Label>Kind</Label>
          <Select value={kind} onValueChange={changeKind}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {editableKinds.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button size="sm" onClick={submit} disabled={!effect}>
          {isEditing ? 'Save' : 'Add'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X size={12} />
        </Button>
      </div>

      <Fields
        value={state as never}
        onChange={(patch) => {
          setState((s: unknown) => ({ ...(s as object), ...patch }));
        }}
        availableData={availableData}
      />
    </FieldGroup>
  );
}

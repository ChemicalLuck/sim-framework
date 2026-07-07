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
import {
  IdSelect,
  TwoCol,
} from '@sim/engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  defineEffectEditor,
} from '@sim/engine/editor/lib/effect-editor';
import type { Effect } from '@sim/engine/types/effect.types';

import type { ContainerEffect } from './types';

const CONTAINER_OPS = [
  'deposit',
  'deposit_wearables',
  'deposit_all',
  'insert',
  'withdraw',
  'withdraw_all',
  'transfer_all',
  'clear',
] as const;
type ContainerOp = (typeof CONTAINER_OPS)[number];

interface ContainerFormState {
  operation: ContainerOp;
  containerId: string;
  itemId: string;
  fromId: string;
  toId: string;
  insertItemId: string;
}

const DEFAULT_STATE: ContainerFormState = {
  operation: 'deposit_wearables',
  containerId: '',
  itemId: '',
  fromId: '',
  toId: '',
  insertItemId: '',
};

const container = defineEffectEditor<ContainerFormState>({
  kind: 'container',
  color: 'bg-orange-900/60 text-orange-200',
  label: (e) => {
    if (e.kind !== 'container') return 'fx';
    const ce = e as unknown as ContainerEffect;
    switch (ce.operation) {
      case 'deposit':
        return `→${ce.containerId}:${ce.itemId}`;
      case 'deposit_wearables':
        return `→${ce.containerId}:wear`;
      case 'deposit_all':
        return `→${ce.containerId}:all`;
      case 'insert':
        return `insert:${ce.containerId}`;
      case 'withdraw':
        return `←${ce.containerId}:${ce.itemId}`;
      case 'withdraw_all':
        return `←${ce.containerId}:all`;
      case 'transfer_all':
        return `${ce.fromId}→${ce.toId}`;
      case 'clear':
        return `clear:${ce.containerId}`;
      default:
        return 'container';
    }
  },
  defaultState: DEFAULT_STATE,
  toFormState: (e) => {
    if (e.kind !== 'container') return DEFAULT_STATE;
    const raw = e as unknown as {
      operation: ContainerOp;
      containerId?: string;
      itemId?: string;
      fromId?: string;
      toId?: string;
      item?: { id: string };
    };
    return {
      operation: raw.operation,
      containerId: raw.containerId ?? '',
      itemId: raw.itemId ?? '',
      fromId: raw.fromId ?? '',
      toId: raw.toId ?? '',
      insertItemId: raw.itemId ?? raw.item?.id ?? '',
    };
  },
  buildEffect: (s) => {
    const op = s.operation;
    if (!s.containerId.trim() && op !== 'transfer_all') return null;
    if (op === 'deposit' || op === 'withdraw') {
      if (!s.itemId.trim()) return null;
      return {
        kind: 'container',
        operation: op,
        containerId: s.containerId.trim(),
        itemId: s.itemId.trim(),
      } as unknown as Effect;
    }
    if (op === 'transfer_all') {
      if (!s.fromId.trim() || !s.toId.trim()) return null;
      return {
        kind: 'container',
        operation: 'transfer_all',
        fromId: s.fromId.trim(),
        toId: s.toId.trim(),
      } as unknown as Effect;
    }
    if (op === 'insert') {
      if (!s.insertItemId.trim()) return null;
      return {
        kind: 'container',
        operation: 'insert',
        containerId: s.containerId.trim(),
        itemId: s.insertItemId.trim(),
      } as unknown as Effect;
    }
    return {
      kind: 'container',
      operation: op,
      containerId: s.containerId.trim(),
    } as unknown as Effect;
  },
  Fields: ({ value, onChange, availableData }) => (
    <>
      <TwoCol>
        <Field>
          <Label>Operation</Label>
          <Select
            value={value.operation}
            onValueChange={(v) => {
              onChange({ operation: v as ContainerOp });
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTAINER_OPS.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {value.operation !== 'transfer_all' && (
          <Field>
            <Label>Container ID</Label>
            <Input
              value={value.containerId}
              onChange={(e) => {
                onChange({ containerId: e.target.value });
              }}
              placeholder="washing_machine"
            />
          </Field>
        )}
      </TwoCol>
      {(value.operation === 'deposit' || value.operation === 'withdraw') && (
        <Field>
          <Label>Item ID</Label>
          <Input
            value={value.itemId}
            onChange={(e) => {
              onChange({ itemId: e.target.value });
            }}
            placeholder="item_id"
          />
        </Field>
      )}
      {value.operation === 'insert' && (
        <IdSelect
          label="Item ID"
          value={value.insertItemId}
          onChange={(v) => {
            onChange({ insertItemId: v });
          }}
          options={(availableData?.items as string[] | undefined) ?? []}
          placeholder="apple"
        />
      )}
      {value.operation === 'transfer_all' && (
        <TwoCol>
          <Field>
            <Label>From container</Label>
            <Input
              value={value.fromId}
              onChange={(e) => {
                onChange({ fromId: e.target.value });
              }}
              placeholder="washing_machine"
            />
          </Field>
          <Field>
            <Label>To container</Label>
            <Input
              value={value.toId}
              onChange={(e) => {
                onChange({ toId: e.target.value });
              }}
              placeholder="dryer"
            />
          </Field>
        </TwoCol>
      )}
    </>
  ),
});

export const editorDataRequirements: DataRequirement[] = [{ key: 'items' }];

declare module '@sim/engine/editor/lib/effect-editor' {
  interface EffectEditorMap {
    container: typeof container;
  }
}

export default { container };

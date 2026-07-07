import type { ActionGroup } from './action-group.types';

export interface ItemFields {
  id: string;
  // Stamped by depositItem when the item enters a container. Absent on
  // templates from the item registry.
  instanceId?: string;
  name: string;
  description?: string;
  value?: number;
  actions?: ActionGroup[];
}

export type Item = ItemFields & {
  kind: 'item';
};

export type Wearable = ItemFields & {
  kind: 'wearable';
  slot: Slot;
  coverage?: Coverage;
  style?: Style;
  appearance: WearableAppearance;
  // Key into the configured size systems. Absent on sizeless wearables
  // (most accessories). When present, `size` is the chosen composite label.
  sizeSystem?: string;
  size?: string;
};

export type InventoryItem = Item | Wearable;

export type Slot = string;

export type Category = string;

export type Coverage = 0 | 1 | 2;

export type Style = string;

export type WearableAppearanceKey = string;
export type WearableAppearance = Partial<Record<WearableAppearanceKey, string>>;

export interface WearableTemplate {
  name: string;
  slot: Slot;
  coverage?: Coverage;
  style?: Style;
  options: Partial<Record<WearableAppearanceKey, string[]>>;
  value: number;
  // Key into the configured size systems; when set, the shop offers a size
  // choice per dimension. Absent on sizeless garments.
  sizeSystem?: string;
}

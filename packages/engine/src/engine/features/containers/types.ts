import type { InventoryItem } from '@sim/engine/types/item.types';

export type ContainerEffect =
  | {
      kind: 'container';
      operation: 'deposit';
      containerId: string;
      itemId: string;
    }
  | { kind: 'container'; operation: 'deposit_wearables'; containerId: string }
  | { kind: 'container'; operation: 'deposit_all'; containerId: string }
  | {
      kind: 'container';
      operation: 'insert';
      containerId: string;
      item: InventoryItem;
    }
  | {
      kind: 'container';
      operation: 'withdraw';
      containerId: string;
      itemId: string;
    }
  | { kind: 'container'; operation: 'withdraw_all'; containerId: string }
  | {
      kind: 'container';
      operation: 'transfer_all';
      fromId: string;
      toId: string;
    }
  | { kind: 'container'; operation: 'clear'; containerId: string };

declare module '@sim/engine/types/effect.types' {
  interface EffectMap {
    container: ContainerEffect;
  }
}

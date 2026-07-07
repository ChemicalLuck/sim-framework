import type { Registry } from '@chemicalluck/sim-engine/data';
import type { Wearable } from '@chemicalluck/sim-engine/types';

import { configureContainers } from '../slice';

let _rawItems: string[] = [];

export function storeContainerSetup(config: { initialItems?: string[] }): void {
  _rawItems = config.initialItems ?? [];
}

export function resolveContainerItems(wearables: Registry<Wearable>): void {
  configureContainers({
    player: _rawItems.map((id) => wearables.get(id)),
  });
}

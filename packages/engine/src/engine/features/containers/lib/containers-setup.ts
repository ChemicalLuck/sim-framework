import type { Registry } from '@sim/engine/data';
import type { Wearable } from '@sim/engine/types';

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

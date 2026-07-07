import type { Registry } from '@sim/engine/data';
import type { BodyAttributes, Wearable } from '@sim/engine/types';

import { configurePlayer } from '../slice';

interface PlayerRawSetup {
  startLocation?: string;
  initialEquipment?: Record<string, string>;
  body?: BodyAttributes;
}

let _raw: PlayerRawSetup = {};

export function storePlayerSetup(config: PlayerRawSetup): void {
  _raw = config;
}

export function resolvePlayerSetup(wearables: Registry<Wearable>): void {
  configurePlayer({
    startLocation: _raw.startLocation,
    body: _raw.body,
    initialEquipment: _raw.initialEquipment
      ? Object.fromEntries(
          Object.entries(_raw.initialEquipment).map(([slot, id]) => [
            slot,
            wearables.get(id),
          ]),
        )
      : undefined,
  });
}

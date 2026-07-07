import { ActionButton } from '@chemicalluck/engine/components/action-button';
import { selectEquipment } from '@chemicalluck/engine/features/player/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';
import type { Wearable } from '@chemicalluck/engine/types';

export default function RemoveEquipment() {
  const equipment = useEngineSelector(selectEquipment);

  const effects = Object.values(equipment)
    .filter((wearable): wearable is Wearable => wearable !== null) // filter nulls
    .map((wearable) => ({
      kind: 'equip' as const,
      operation: 'doff' as const,
      wearable,
    }));

  return <ActionButton effects={effects}>Take off your clothes</ActionButton>;
}

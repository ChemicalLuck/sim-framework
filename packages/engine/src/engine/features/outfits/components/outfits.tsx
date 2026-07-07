import { ActionButton } from '@chemicalluck/engine/components/action-button';
import { Card } from '@chemicalluck/engine/components/ui/card';
import { selectOutfits } from '@chemicalluck/engine/features/outfits/selectors';
import { useEngineSelector } from '@chemicalluck/engine/state/store';

import OutfitSave from './outfit-save';

export default function Outfits() {
  const outfits = useEngineSelector(selectOutfits);

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Outfits</h2>
      <OutfitSave />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {outfits.length === 0 ? (
          <p>No Outfits</p>
        ) : (
          outfits.map((o) => (
            <Card
              key={o.name}
              className="flex flex-col items-center justify-between gap-2 p-4"
            >
              <span className="text-sm font-medium">{o.name}</span>
              <ActionButton effects={[{ kind: 'applyOutfit', name: o.name }]}>
                Wear
              </ActionButton>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

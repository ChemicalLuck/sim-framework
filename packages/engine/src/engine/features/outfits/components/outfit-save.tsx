import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@sim/engine/components/ui/button';
import { Input } from '@sim/engine/components/ui/input';
import { addOutfit } from '@sim/engine/features/outfits/slice';
import { selectEquipment } from '@sim/engine/features/player/selectors';
import { useEngineDispatch, useEngineSelector } from '@sim/engine/state/store';

export default function OutfitSave() {
  const equipment = useEngineSelector(selectEquipment);
  const dispatch = useEngineDispatch();
  const [name, setName] = useState<string>('');

  return (
    <div className="flex flex-col gap-2 mb-4">
      <p>Save your current outfit</p>
      <div className="flex gap-2">
        <Input
          placeholder="Outfit Name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value);
          }}
          className="max-w-[180px]"
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (!name) return;
            toast(`Outfit Saved: ${name}`);
            dispatch(
              addOutfit({
                name,
                equipment,
              }),
            );
            setName(''); // optional: clear the input after saving
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

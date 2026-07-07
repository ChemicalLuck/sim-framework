import { useState } from 'react';
import { Button } from '@sim/engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@sim/engine/components/ui/dialog';
import { SaveSlotList } from '@sim/engine/features/save/components/save-slot-list';
import { getSaveSlots } from '@sim/engine/features/save/saves';

export default function LoadSaveDialog() {
  const [slots, setSlots] = useState(() => getSaveSlots());

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Load Save</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Load Save</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <SaveSlotList slots={slots} onSlotsChange={setSlots} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

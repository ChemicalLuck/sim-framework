import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@sim/engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@sim/engine/components/ui/dialog';
import { Input } from '@sim/engine/components/ui/input';
import { selectPlayerName } from '@sim/engine/features/player/selectors';
import { SaveSlotList } from '@sim/engine/features/save/components/save-slot-list';
import { getSaveSlots, saveGame } from '@sim/engine/features/save/saves';
import { selectTimestamp } from '@sim/engine/features/time/selectors';
import { useEngineSelector } from '@sim/engine/state/store';

export default function SaveLoadDialog() {
  const [saveName, setSaveName] = useState('');
  const [slots, setSlots] = useState(() => getSaveSlots());

  const playerName = useEngineSelector(selectPlayerName);
  const time = useEngineSelector(selectTimestamp);

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveGame(saveName, playerName, new Date(time).toLocaleString());
    setSlots(getSaveSlots());
    setSaveName('');
    toast.success('Game Saved');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <Save className="size-4" />
          Save / Load
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save / Load Game</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            New Save
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter save name"
              value={saveName}
              onChange={(e) => {
                setSaveName(e.target.value);
              }}
            />
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>

        <div className="my-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Load Save
          </h3>
          <SaveSlotList slots={slots} onSlotsChange={setSlots} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

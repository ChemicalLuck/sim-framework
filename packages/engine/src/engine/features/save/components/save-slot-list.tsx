import { toast } from 'sonner';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  type GameSaveMetadata,
  getSaveSlots,
  loadGame,
} from '@chemicalluck/sim-engine/features/save/saves';

interface SaveSlotListProps {
  slots: GameSaveMetadata[];
  onSlotsChange: (slots: GameSaveMetadata[]) => void;
}

export function SaveSlotList({ slots, onSlotsChange }: SaveSlotListProps) {
  const handleLoad = (slot: GameSaveMetadata) => {
    if (
      window.confirm(
        `Load save "${slot.name}"? Your current progress will be replaced.`,
      )
    ) {
      loadGame(slot);
    }
  };

  const handleDelete = (slot: GameSaveMetadata) => {
    if (!window.confirm(`Delete save "${slot.name}"?`)) return;
    localStorage.removeItem(slot.storageKey);
    const newSlots = getSaveSlots().filter(
      (s) => s.storageKey !== slot.storageKey,
    );
    localStorage.setItem('saveSlots', JSON.stringify(newSlots));
    onSlotsChange(newSlots);
    toast.warning('Save deleted.');
  };

  if (slots.length === 0) {
    return <p className="text-sm text-muted-foreground">No saves yet.</p>;
  }

  return (
    <ul className="space-y-2 max-h-64 overflow-y-auto">
      {slots.map((slot) => (
        <li
          key={slot.storageKey}
          className="flex justify-between items-center border p-2 rounded"
        >
          <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
            <span>
              <strong>Character:</strong> {slot.characterName}
            </span>
            <span>
              <strong>In-Game Time:</strong> {slot.inGameTime}
            </span>
            <span>
              <strong>Saved At:</strong>{' '}
              {new Date(slot.timestamp).toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                handleLoad(slot);
              }}
            >
              Load
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                handleDelete(slot);
              }}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

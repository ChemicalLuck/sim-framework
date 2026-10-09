import { useState } from 'react';

import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { Checkbox } from '@chemicalluck/sim-engine/components/ui/checkbox';
import { Label } from '@chemicalluck/sim-engine/components/ui/label';
import { regenerateNpcs } from '@chemicalluck/sim-engine/features/npcs/slice';
import { setGameSeed } from '@chemicalluck/sim-engine/features/rng/slice';
import {
  getRunOptions,
  startRun,
} from '@chemicalluck/sim-engine/features/save/slice';
import { setView } from '@chemicalluck/sim-engine/features/view/slice';
import { useEngineDispatch } from '@chemicalluck/sim-engine/state/store';

export function NewGameButton() {
  const dispatch = useEngineDispatch();
  const mode = getRunOptions().ironman;
  const [ironmanChosen, setIronmanChosen] = useState(false);
  const ironman = mode === 'always' || (mode === 'optional' && ironmanChosen);

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        className="w-full"
        onClick={() => {
          const seed = Date.now();
          dispatch(startRun({ ironman }));
          dispatch(setGameSeed(seed));
          dispatch(regenerateNpcs(seed));
          dispatch(
            setView({ activeViewId: 'CharacterCustomisationView', props: {} }),
          );
        }}
      >
        New Game
      </Button>
      {mode === 'optional' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="ironman"
            checked={ironmanChosen}
            onCheckedChange={(v) => {
              setIronmanChosen(v === true);
            }}
          />
          <Label htmlFor="ironman" className="text-xs text-muted-foreground">
            Ironman (no undo, single autosave)
          </Label>
        </div>
      )}
    </div>
  );
}

import { Button } from '@sim/engine/components/ui/button';
import { regenerateNpcs } from '@sim/engine/features/npcs/slice';
import { setGameSeed } from '@sim/engine/features/rng/slice';
import { setView } from '@sim/engine/features/view/slice';
import { useEngineDispatch } from '@sim/engine/state/store';

export function NewGameButton() {
  const dispatch = useEngineDispatch();
  return (
    <Button
      className="w-full"
      onClick={() => {
        const seed = Date.now();
        dispatch(setGameSeed(seed));
        dispatch(regenerateNpcs(seed));
        dispatch(
          setView({ activeViewId: 'CharacterCustomisationView', props: {} }),
        );
      }}
    >
      New Game
    </Button>
  );
}

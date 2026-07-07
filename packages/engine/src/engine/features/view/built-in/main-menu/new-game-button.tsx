import { Button } from '@chemicalluck/engine/components/ui/button';
import { regenerateNpcs } from '@chemicalluck/engine/features/npcs/slice';
import { setGameSeed } from '@chemicalluck/engine/features/rng/slice';
import { setView } from '@chemicalluck/engine/features/view/slice';
import { useEngineDispatch } from '@chemicalluck/engine/state/store';

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

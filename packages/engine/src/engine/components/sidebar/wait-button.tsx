import { Clock } from 'lucide-react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { useEngineDispatch } from '@chemicalluck/engine/state/store';
import { processEffects } from '@chemicalluck/engine/state/thunks';

export default function WaitButton() {
  const dispatch = useEngineDispatch();
  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => {
        dispatch(
          processEffects([
            {
              kind: 'time',
              minutes: 20,
            },
          ]),
        );
      }}
    >
      <Clock className="size-4" />
      Wait 20m
    </Button>
  );
}

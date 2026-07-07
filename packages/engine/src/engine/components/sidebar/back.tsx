import { Redo2, Undo2 } from 'lucide-react';
import { useCallback } from 'react';
import { ActionCreators } from 'redux-undo';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import { useEngineDispatch, useEngineSelector } from '@chemicalluck/sim-engine/state/store';

export default function BackButton() {
  const dispatch = useEngineDispatch();

  const canUndo = useEngineSelector((state) => state.past.length > 0);
  const canRedo = useEngineSelector((state) => state.future.length > 0);

  const onUndo = useCallback(() => {
    if (canUndo) dispatch(ActionCreators.undo());
  }, [dispatch, canUndo]);

  const onRedo = useCallback(() => {
    if (canRedo) dispatch(ActionCreators.redo());
  }, [dispatch, canRedo]);

  return (
    <div className="flex gap-2">
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        aria-disabled={!canUndo}
        title="Undo (Ctrl/Cmd+Z)"
        size="icon"
        variant="secondary"
      >
        <Undo2 />
      </Button>

      <Button
        onClick={onRedo}
        disabled={!canRedo}
        aria-disabled={!canRedo}
        title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
        size="icon"
        variant="secondary"
      >
        <Redo2 />
      </Button>
    </div>
  );
}

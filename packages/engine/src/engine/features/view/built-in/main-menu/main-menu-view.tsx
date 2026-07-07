import { GraduationCap } from 'lucide-react';
import WithCentered from '@chemicalluck/sim-engine/components/with-centered';
import { appName } from '@chemicalluck/sim-engine/lib/core';

import LoadSaveDialog from './load-save-dialog';
import { NewGameButton } from './new-game-button';

function MainMenuView() {
  return (
    <WithCentered>
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h1 className="text-4xl font-bold tracking-tight">{appName}</h1>
            <p className="text-sm text-muted-foreground">
              A text-based life simulator
            </p>
          </div>
        </div>
        <div className="flex w-full max-w-[200px] flex-col gap-3">
          <NewGameButton />
          <LoadSaveDialog />
        </div>
      </div>
    </WithCentered>
  );
}

export default MainMenuView;

import React, { useState } from 'react';
import { Provider } from 'react-redux';
import type { Transform } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import * as gameExtensions from 'virtual:game-extensions';
import 'virtual:game-setup';

import { GameSidebar as DefaultSidebar } from '@chemicalluck/sim-engine/components/sidebar';
import { SidebarComponentContext } from '@chemicalluck/sim-engine/components/sidebar/context';
import { SidebarProvider } from '@chemicalluck/sim-engine/components/ui/sidebar';
import { Toaster } from '@chemicalluck/sim-engine/components/ui/sonner';
import { ThemeProvider } from '@chemicalluck/sim-engine/components/ui/theme-provider';
import { registerPersistFlush } from '@chemicalluck/sim-engine/features/save/saves';
import {
  type AutosaveOptions,
  type IronmanMode,
  configureRunOptions,
  getRunOptions,
} from '@chemicalluck/sim-engine/features/save/slice';
import {
  ViewsContext,
  type ViewsRegistry,
} from '@chemicalluck/sim-engine/features/view/context';
import ViewManager from '@chemicalluck/sim-engine/features/view/manager';
import {
  type EngineStore,
  buildStore,
} from '@chemicalluck/sim-engine/state/store';
import { initProcessEffects } from '@chemicalluck/sim-engine/state/thunks';

export interface GameConfig {
  /** Game-specific sidebar component (replaces the engine default) */
  sidebar?: React.ComponentType;
  /** Additional views merged with engine base views */
  views?: ViewsRegistry;
  /** Additional redux-persist transforms */
  persistTransforms?: Transform<unknown, unknown>[];
  /** Undo steps kept for the Back button (default 10). 0 disables undo. */
  undoLimit?: number;
  /**
   * Ironman mode: no undo and no manual save/load for the run, which is chosen
   * at New Game and stored with it. `never` (default), `optional` (a New Game
   * checkbox) or `always`.
   */
  ironman?: IronmanMode;
  /**
   * Snapshots made by `autosave` effects: how many rotating ones to keep
   * (default 3). Ironman runs make none.
   */
  autosave?: AutosaveOptions;
}

function setupGame(config: GameConfig) {
  configureRunOptions({
    ...(config.undoLimit !== undefined && { undoLimit: config.undoLimit }),
    ...(config.ironman !== undefined && { ironman: config.ironman }),
    ...(config.autosave !== undefined && { autosave: config.autosave }),
  });

  initProcessEffects(
    gameExtensions.effectHandlers,
    gameExtensions.postEffectHandlers,
  );

  const { store, persistor } = buildStore(
    gameExtensions.slices,
    config.persistTransforms ?? [],
    { undoLimit: getRunOptions().undoLimit },
  );
  registerPersistFlush(() => persistor.flush());

  gameExtensions.storeInitializers.forEach((init) => {
    init(store as unknown as EngineStore);
  });

  const allViews: ViewsRegistry = {
    ...gameExtensions.views,
    ...(config.views ?? {}),
  };
  const SidebarComponent = config.sidebar ?? DefaultSidebar;

  return { store, persistor, allViews, SidebarComponent };
}

const DEFAULT_CONFIG: GameConfig = {};

export function GameEngine({
  config = DEFAULT_CONFIG,
}: {
  config?: GameConfig;
}) {
  const [{ store, persistor, allViews, SidebarComponent }] = useState(() =>
    setupGame(config),
  );

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <ThemeProvider>
          <SidebarProvider>
            <SidebarComponentContext value={SidebarComponent}>
              <ViewsContext value={allViews}>
                <ViewManager />
                <Toaster />
              </ViewsContext>
            </SidebarComponentContext>
          </SidebarProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

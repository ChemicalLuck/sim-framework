import React, { useState } from 'react';
import { Provider } from 'react-redux';
import type { Transform } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import * as gameExtensions from 'virtual:game-extensions';
import 'virtual:game-setup';
import { GameSidebar as DefaultSidebar } from '@sim/engine/components/sidebar';
import { SidebarComponentContext } from '@sim/engine/components/sidebar/context';
import { SidebarProvider } from '@sim/engine/components/ui/sidebar';
import { Toaster } from '@sim/engine/components/ui/sonner';
import { ThemeProvider } from '@sim/engine/components/ui/theme-provider';
import {
  ViewsContext,
  type ViewsRegistry,
} from '@sim/engine/features/view/context';
import ViewManager from '@sim/engine/features/view/manager';
import { type EngineStore, buildStore } from '@sim/engine/state/store';
import { initProcessEffects } from '@sim/engine/state/thunks';

export interface GameConfig {
  /** Game-specific sidebar component (replaces the engine default) */
  sidebar?: React.ComponentType;
  /** Additional views merged with engine base views */
  views?: ViewsRegistry;
  /** Additional redux-persist transforms */
  persistTransforms?: Transform<unknown, unknown>[];
}

function setupGame(config: GameConfig) {
  initProcessEffects(
    gameExtensions.effectHandlers,
    gameExtensions.postEffectHandlers,
  );

  const { store, persistor } = buildStore(
    gameExtensions.slices,
    config.persistTransforms ?? [],
  );

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

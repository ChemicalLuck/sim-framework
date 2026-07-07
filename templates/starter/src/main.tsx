import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameEngine } from '@chemicalluck/engine';
import { GlobalLogger } from '@chemicalluck/engine/lib/logger';

import '~/game/index.css';

if (import.meta.env.DEV) {
  GlobalLogger.configure({ enabled: true });
}

const root = document.getElementById('root');
if (!root) throw new Error('Root missing, failed to render');

// Pass `config={{ sidebar: YourSidebar }}` to replace the engine's default
// sidebar, or `config={{ views: {...} }}` to register extra views.
createRoot(root).render(
  <StrictMode>
    <GameEngine />
  </StrictMode>,
);

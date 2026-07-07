import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import editorExtensions from 'virtual:editor-extensions';
import 'virtual:editor-game-styles';
import { EffectEditorsProvider } from '@chemicalluck/sim-engine/editor/lib/effect-editor-provider';

import App from './app';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root missing');
createRoot(root).render(
  <StrictMode>
    <EffectEditorsProvider
      engineEditors={editorExtensions.engineEffectEditors}
      extensionEditors={editorExtensions.effectEditors}
      legacyRenderers={editorExtensions.effectRenderers}
    >
      <App />
    </EffectEditorsProvider>
  </StrictMode>,
);

import { type ReactNode, useMemo } from 'react';

import { type EffectEditorModule, EffectEditorsContext } from './effect-editor';
import type { EffectRenderer } from './effect-renderers';

function rendererToStubEditor(
  kind: string,
  renderer: EffectRenderer,
): EffectEditorModule {
  return {
    kind,
    color: renderer.color,
    label: renderer.label,
    defaultState: {},
    toFormState: () => ({}),
    buildEffect: () => null,
    Fields: () => null,
    hidden: true,
  };
}

export function EffectEditorsProvider({
  engineEditors,
  extensionEditors,
  legacyRenderers,
  children,
}: {
  engineEditors?: Record<string, EffectEditorModule>;
  extensionEditors?: Record<string, EffectEditorModule>;
  legacyRenderers?: Record<string, EffectRenderer>;
  children: ReactNode;
}) {
  const merged = useMemo(() => {
    const out: Record<string, EffectEditorModule> = {};
    if (engineEditors) Object.assign(out, engineEditors);
    if (extensionEditors) Object.assign(out, extensionEditors);
    if (legacyRenderers) {
      for (const [kind, renderer] of Object.entries(legacyRenderers)) {
        if (!(kind in out)) {
          out[kind] = rendererToStubEditor(kind, renderer);
        }
      }
    }
    return out;
  }, [engineEditors, extensionEditors, legacyRenderers]);

  return <EffectEditorsContext value={merged}>{children}</EffectEditorsContext>;
}

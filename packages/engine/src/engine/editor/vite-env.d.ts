declare module 'virtual:editor-game-styles';

declare module 'virtual:editor-extensions' {
  import type { ComponentType } from 'react';
  import type {
    DataRequirement,
    EffectEditorModule,
    ViewSectionSpec,
  } from '@chemicalluck/sim-engine/editor/lib/effect-editor';
  import type { EffectRenderer } from '@chemicalluck/sim-engine/editor/lib/effect-renderers';

  export interface EditorPanel {
    label: string;
    group?: string;
    /**
     * Data file (base name, no extension) this panel edits. Declaring it lets
     * the shared `usePanelEntries` hook derive the panel's endpoint and the
     * namespace of each entry dynamically — no string literals in the component.
     * List panels set it; single-record/config panels omit it.
     */
    file?: string;
    component: ComponentType;
  }

  export interface EditorExtensions {
    /** Engine-feature-owned editor modules (auto-discovered). */
    engineEffectEditors?: Record<string, EffectEditorModule>;
    /** Game-extension-owned editor modules (full form + renderer). */
    effectEditors?: Record<string, EffectEditorModule>;
    /** Legacy game-extension renderer-only registrations. */
    effectRenderers?: Record<string, EffectRenderer>;
    panels?: Record<string, EditorPanel>;
    extensionViewIds?: string[];
    viewSections?: ViewSectionSpec[];
    dataRequirements?: DataRequirement[];
  }

  const extensions: EditorExtensions;
  export default extensions;
}

export interface JsonViewSceneEffect {
  kind: 'view';
  activeViewId: 'SceneView';
  sceneId: string;
}

export interface JsonViewScriptEffect {
  kind: 'view';
  activeViewId: 'ScriptView';
  scriptId: string;
}

declare module '@chemicalluck/engine/data/authoring.types' {
  interface JsonEffectMap {
    view_scene: JsonViewSceneEffect;
    view_script: JsonViewScriptEffect;
  }
}

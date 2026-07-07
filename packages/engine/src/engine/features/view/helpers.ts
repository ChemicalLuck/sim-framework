import type { Effect, Scene, Script } from '@chemicalluck/sim-engine/types';

export const viewDefault = (): Effect[] => [
  { kind: 'view', activeViewId: 'DefaultView', props: {} },
];

export const viewScene = (scene: Scene): Effect[] => [
  { kind: 'view', activeViewId: 'SceneView', props: { scene } },
];

export const viewOutfits = (): Effect[] => [
  { kind: 'view', activeViewId: 'OutfitView', props: {} },
];

export const viewScript = (script: Script): Effect[] => [
  { kind: 'view', activeViewId: 'ScriptView', props: { script } },
];

export const viewNpc = (npcId: string): Effect[] => [
  { kind: 'view', activeViewId: 'NpcView', props: { npcId } },
];

export const viewConversation = (npcId: string): Effect[] => [
  { kind: 'view', activeViewId: 'ConversationView', props: { npcId } },
];
